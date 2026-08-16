/**
 * Windows-native CMake build of giovanni_native.lib.
 *
 * Uses vcpkg to supply qpdf — no Docker, no manual setup required.
 * On first run, bootstraps a project-local vcpkg under .tmp/vcpkg.
 * Produces build/native/giovanni_native.lib + giovanni_c.h.
 *
 * Ghostscript (GhostPDL) is also built here, but differently: it has no
 * static-lib build target on Windows (only autoconf/make on Linux does —
 * see native/targets/native/docker.Dockerfile). The MSVC makefile
 * (psi/msvc.mak) only produces gsdll64.dll + its import lib gsdll64.lib.
 * We fetch GhostPDL source, build that with nmake in a VS dev environment,
 * and link giovanni_native against the import lib. Unlike qpdf, this means
 * gsdll64.dll is a runtime dependency that must ship alongside
 * giovanni_native.lib — see step 9 below.
 *
 * Usage:
 *   pnpm --filter @acajoo/giovanni-core build:native:win [dev|prd]
 *
 * Prerequisites:
 *   - git   (to clone vcpkg on first run if not already present)
 *   - MSVC  (Visual Studio 2022 with C++ Desktop workload, incl. nmake)
 *   - cmake (bundled with VS 2022, or install separately)
 *
 * Optional env vars:
 *   VCPKG_ROOT              — use an existing standalone vcpkg instead of bootstrapping
 *   GIOVANNI_VCPKG_TRIPLET  — override triplet (default: x64-windows-static)
 *   GIOVANNI_CMAKE_GENERATOR — override generator (default: auto-detected)
 *   GIOVANNI_NATIVE_JOBS    — cmake --parallel value
 *   GIOVANNI_SKIP_GHOSTSCRIPT — set to skip building Ghostscript; GhostscriptEngine falls back to a stub
 */

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync } from "node:fs";
import { cp, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { VENDOR_PINS } from "./upstreams";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(scriptDir, "..", "..");
const repoRoot = resolve(packageRoot, "..", "..");

const NATIVE_TARGET_DIR = resolve(packageRoot, "native", "targets", "native");
const BUILD_DIR = resolve(packageRoot, ".tmp", "cmake-native-win");
const INSTALL_DIR = resolve(packageRoot, ".tmp", "cmake-native-win-install");
const LOCAL_VCPKG = resolve(packageRoot, ".tmp", "vcpkg");
const OUTPUT_DIR = resolve(packageRoot, "build", "native");
const GHOSTPDL_ARCHIVE = resolve(packageRoot, ".tmp", "ghostpdl.tar.gz");
const GHOSTPDL_SRC_DIR = resolve(packageRoot, ".tmp", "ghostpdl-src");

// Static libs + static CRT (/MT) — must match Rust's MSVC CRT linkage.
const VCPKG_TRIPLET = process.env.GIOVANNI_VCPKG_TRIPLET ?? "x64-windows-static";

// ---------------------------------------------------------------------------
// Process helpers
// ---------------------------------------------------------------------------

async function run(command: string, args: string[], cwd = repoRoot): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        const child = spawn(command, args, { cwd, stdio: "inherit", shell: false });
        child.on("error", (err) => {
            if ((err as NodeJS.ErrnoException).code === "ENOENT") {
                reject(new Error(`Command not found: ${command}\nEnsure it is installed and on your PATH.`));
            } else {
                reject(err);
            }
        });
        child.on("exit", (code) => {
            if (code === 0) resolve();
            else reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "unknown"}`));
        });
    });
}

async function capture(command: string, args: string[], cwd = repoRoot): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const child = spawn(command, args, { cwd, stdio: ["ignore", "pipe", "inherit"], shell: false });
        let stdout = "";
        child.stdout?.on("data", (chunk: Buffer) => {
            stdout += chunk.toString();
        });
        child.on("error", reject);
        child.on("exit", (code) => {
            if (code === 0) resolve(stdout.trim());
            else reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "unknown"}`));
        });
    });
}

// ---------------------------------------------------------------------------
// MSVC tool discovery
// ---------------------------------------------------------------------------

const VS_BASE_PATHS = [
    "C:\\Program Files\\Microsoft Visual Studio\\2022\\Community",
    "C:\\Program Files\\Microsoft Visual Studio\\2022\\Enterprise",
    "C:\\Program Files\\Microsoft Visual Studio\\2022\\Professional",
    "C:\\Program Files\\Microsoft Visual Studio\\18\\Community",
    "C:\\Program Files\\Microsoft Visual Studio\\18\\Enterprise",
    "C:\\Program Files\\Microsoft Visual Studio\\18\\Professional",
];

function findCmake(): string {
    for (const vsBase of VS_BASE_PATHS) {
        const candidate = join(vsBase, "Common7", "IDE", "CommonExtensions", "Microsoft", "CMake", "CMake", "bin", "cmake.exe");
        if (existsSync(candidate)) return candidate;
    }
    return "cmake";
}

function defaultGeneratorForCmake(cmakePath: string): string {
    const normalized = cmakePath.replace(/\\/g, "/");
    if (normalized.includes("/Microsoft Visual Studio/18/")) {
        return "Visual Studio 18 2026";
    }
    return "Visual Studio 17 2022";
}

function findVcvarsall(): string {
    for (const vsBase of VS_BASE_PATHS) {
        const candidate = join(vsBase, "VC", "Auxiliary", "Build", "vcvarsall.bat");
        if (existsSync(candidate)) return candidate;
    }
    throw new Error("Could not find vcvarsall.bat under any known Visual Studio installation path.");
}

/** Run a command inside an MSVC x64 developer environment (cl/link/nmake on PATH, INCLUDE/LIB set). */
async function runInVsDevShell(vcvarsall: string, cwd: string, commandLine: string): Promise<void> {
    await new Promise<void>((resolvePromise, rejectPromise) => {
        // shell: true lets Node quote the composed line for cmd.exe itself —
        // pre-quoting it ourselves and passing as a single argv element (with
        // shell: false) gets mangled by Windows' argv escaping.
        const fullCommand = `call "${vcvarsall}" x64 >nul && ${commandLine}`;
        const child = spawn(fullCommand, { cwd, stdio: "inherit", shell: true });
        child.on("error", rejectPromise);
        child.on("exit", (code) => {
            if (code === 0) resolvePromise();
            else rejectPromise(new Error(`Command failed (exit ${code ?? "unknown"}): ${commandLine}`));
        });
    });
}

// ---------------------------------------------------------------------------
// Ghostscript (GhostPDL) — optional
// ---------------------------------------------------------------------------
// GhostPDL's MSVC makefile has no static-lib target (unlike its Unix
// ./configure && make libgs path) — only gsdll64.dll + the gsdll64.lib
// import lib it produces implicitly. We fetch source and build that
// ourselves with nmake; giovanni_native links against the import lib, and
// the .dll ships alongside it as a runtime dependency.

/**
 * Download + extract the pinned GhostPDL source (idempotent — skips if
 * already present) and disable Tesseract/OCR, which the MSVC makefile
 * auto-enables just because the tesseract/ directory exists in the
 * tarball (`!if exist("tesseract")` in psi/msvc.mak). We don't need OCR
 * for pdfwrite/ps2write rewriting and it roughly triples build time —
 * mirrors --without-tesseract on the Linux ./configure path.
 */
async function ensureGhostpdlSource(): Promise<string> {
    const marker = join(GHOSTPDL_SRC_DIR, "psi", "iapi.h");
    if (existsSync(marker)) return GHOSTPDL_SRC_DIR;

    console.log(`\n[giovanni] Fetching GhostPDL ${VENDOR_PINS.ghostscript.version} source...`);
    await mkdir(dirname(GHOSTPDL_ARCHIVE), { recursive: true });

    const response = await fetch(VENDOR_PINS.ghostscript.archiveUrl);
    if (!response.ok) {
        throw new Error(`Failed to download GhostPDL source: ${response.status} ${response.statusText}`);
    }
    await writeFile(GHOSTPDL_ARCHIVE, Buffer.from(await response.arrayBuffer()));

    if (VENDOR_PINS.ghostscript.sha256) {
        const hash = createHash("sha256")
            .update(await readFile(GHOSTPDL_ARCHIVE))
            .digest("hex");
        if (hash !== VENDOR_PINS.ghostscript.sha256) {
            throw new Error(`GhostPDL archive checksum mismatch: expected ${VENDOR_PINS.ghostscript.sha256}, got ${hash}`);
        }
    }

    await rm(GHOSTPDL_SRC_DIR, { recursive: true, force: true });
    await mkdir(GHOSTPDL_SRC_DIR, { recursive: true });
    await run("tar", ["-xzf", GHOSTPDL_ARCHIVE, "--strip-components=1", "-C", GHOSTPDL_SRC_DIR]);

    const tesseractDir = join(GHOSTPDL_SRC_DIR, "tesseract");
    if (existsSync(tesseractDir)) {
        await rename(tesseractDir, `${tesseractDir}.disabled`);
    }

    return GHOSTPDL_SRC_DIR;
}

/** Build gsdll64.dll + gsdll64.lib via nmake. Not parallelizable — nmake has no -j. */
async function buildGhostscript(srcDir: string): Promise<{ lib: string; dll: string }> {
    const vcvarsall = findVcvarsall();
    console.log("\n[giovanni] Building Ghostscript (nmake, single-threaded — this takes a while)...");
    await runInVsDevShell(vcvarsall, srcDir, "nmake -f psi\\msvc.mak WIN64= DEVSTUDIO=");

    const lib = join(srcDir, "bin", "gsdll64.lib");
    const dll = join(srcDir, "bin", "gsdll64.dll");
    if (!existsSync(lib) || !existsSync(dll)) {
        throw new Error(`Expected Ghostscript build output not found: ${lib} / ${dll}\nCheck the nmake output above for errors.`);
    }
    return { lib, dll };
}

// ---------------------------------------------------------------------------
// vcpkg bootstrap
// ---------------------------------------------------------------------------

/**
 * Return the path to a usable standalone vcpkg:
 *   1. VCPKG_ROOT if set and valid
 *   2. C:\vcpkg if present
 *   3. Otherwise clone + bootstrap a project-local copy under .tmp/vcpkg
 *
 * The VS-bundled vcpkg (%VS%\VC\vcpkg) is intentionally skipped — it is not
 * a git repo so we cannot read its baseline, and it only supports manifest
 * mode with a required baseline, creating a circular dependency.
 */
async function ensureVcpkg(): Promise<string> {
    // User-configured or common standalone locations (git-backed)
    for (const candidate of [process.env.VCPKG_ROOT, "C:\\vcpkg"]) {
        if (candidate && existsSync(join(candidate, "vcpkg.exe")) && existsSync(join(candidate, ".git"))) {
            return candidate;
        }
    }

    // Bootstrap project-local vcpkg
    if (!existsSync(join(LOCAL_VCPKG, ".git"))) {
        console.log(`\n[giovanni] Cloning vcpkg into .tmp/vcpkg (one-time, ~50 MB)...`);
        await run("git", ["clone", "--depth=1", "https://github.com/microsoft/vcpkg.git", LOCAL_VCPKG]);
    }

    if (!existsSync(join(LOCAL_VCPKG, "vcpkg.exe"))) {
        console.log("[giovanni] Bootstrapping vcpkg...");
        await run("cmd", ["/c", "bootstrap-vcpkg.bat", "-disableMetrics"], LOCAL_VCPKG);
    }

    return LOCAL_VCPKG;
}

async function getVcpkgBaseline(vcpkgRoot: string): Promise<string> {
    const sha = await capture("git", ["-C", vcpkgRoot, "rev-parse", "HEAD"]);
    if (!/^[0-9a-f]{40}$/i.test(sha)) throw new Error(`Unexpected git output: ${sha}`);
    return sha;
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
    const rawArgs = process.argv.slice(2);
    const args = rawArgs[0] === "--" ? rawArgs.slice(1) : rawArgs;
    const [modeArg = "prd"] = args;

    if (modeArg !== "dev" && modeArg !== "prd") {
        throw new Error(`Usage: build-native-windows [dev|prd]`);
    }

    const buildType = modeArg === "prd" ? "Release" : "Debug";
    const cmake = findCmake();
    const generator = process.env.GIOVANNI_CMAKE_GENERATOR ?? defaultGeneratorForCmake(cmake);
    const jobs = process.env.GIOVANNI_NATIVE_JOBS ?? "";

    // ── 1. Ensure vcpkg ────────────────────────────────────────────────────
    const vcpkgRoot = await ensureVcpkg();
    const toolchain = join(vcpkgRoot, "scripts", "buildsystems", "vcpkg.cmake");
    const baseline = await getVcpkgBaseline(vcpkgRoot);

    console.log(`\n[giovanni] Windows native build (${buildType})`);
    console.log(`  vcpkg     : ${vcpkgRoot}  [${VCPKG_TRIPLET}]`);
    console.log(`  baseline  : ${baseline.slice(0, 12)}…`);
    console.log(`  cmake     : ${cmake}  [${generator}]`);
    console.log(`  output    : ${OUTPUT_DIR}`);

    // ── 1b. Ghostscript (optional) ─────────────────────────────────────────
    let ghostscript: { lib: string; dll: string; sourceDir: string } | undefined;
    if (process.env.GIOVANNI_SKIP_GHOSTSCRIPT) {
        console.log("[giovanni] GIOVANNI_SKIP_GHOSTSCRIPT set — GhostscriptEngine will be a stub");
    } else {
        const ghostpdlSrc = await ensureGhostpdlSource();
        const built = await buildGhostscript(ghostpdlSrc);
        ghostscript = { ...built, sourceDir: ghostpdlSrc };
        console.log(`  ghostscript: ${built.dll}`);
    }

    // ── 2. Prepare directories ─────────────────────────────────────────────
    await rm(BUILD_DIR, { recursive: true, force: true });
    await rm(INSTALL_DIR, { recursive: true, force: true });
    await mkdir(BUILD_DIR, { recursive: true });
    await mkdir(OUTPUT_DIR, { recursive: true });

    // ── 3. Write versioned manifest into build dir ─────────────────────────
    // We write vcpkg.json here rather than the source tree so the baseline
    // (a git SHA) stays in sync with the vcpkg version without manual updates.
    const manifest = {
        name: "giovanni-native",
        "version-string": "0.1.0",
        "builtin-baseline": baseline,
        dependencies: ["qpdf"],
    };
    await writeFile(join(BUILD_DIR, "vcpkg.json"), JSON.stringify(manifest, null, 2) + "\n");

    // ── 4. CMake configure ─────────────────────────────────────────────────
    // CMAKE_MSVC_RUNTIME_LIBRARY must match the vcpkg triplet's CRT linkage.
    // x64-windows-static uses /MT (static CRT); CMake defaults to /MD, which
    // causes LNK2038 (CRT mismatch) when linking against qpdf.lib.
    const msvcRuntime = buildType === "Debug" ? "MultiThreadedDebug" : "MultiThreaded";

    console.log("\n[giovanni] cmake configure...");
    await run(cmake, [
        "-S",
        NATIVE_TARGET_DIR,
        "-B",
        BUILD_DIR,
        "-G",
        generator,
        "-A",
        "x64",
        `-DCMAKE_TOOLCHAIN_FILE=${toolchain}`,
        `-DVCPKG_TARGET_TRIPLET=${VCPKG_TRIPLET}`,
        `-DVCPKG_MANIFEST_DIR=${BUILD_DIR}`,
        "-DGIOVANNI_USE_SYSTEM_QPDF=ON",
        "-DBUILD_SHARED_LIBS=OFF",
        `-DCMAKE_MSVC_RUNTIME_LIBRARY=${msvcRuntime}`,
        `-DCMAKE_INSTALL_PREFIX=${INSTALL_DIR}`,
        ...(ghostscript
            ? [`-DGIOVANNI_GHOSTSCRIPT_LIB=${ghostscript.lib}`, `-DGIOVANNI_GHOSTSCRIPT_DLL=${ghostscript.dll}`, `-DGIOVANNI_GHOSTSCRIPT_SOURCE_DIR=${ghostscript.sourceDir}`]
            : []),
    ]);

    // ── 5. CMake build ─────────────────────────────────────────────────────
    console.log(`\n[giovanni] cmake build (${buildType})...`);
    await run(cmake, ["--build", BUILD_DIR, "--config", buildType, "--target", "giovanni_native", ...(jobs ? ["--parallel", jobs] : ["--parallel"])]);

    // ── 6. CMake install ───────────────────────────────────────────────────
    console.log("\n[giovanni] cmake install...");
    await run(cmake, ["--install", BUILD_DIR, "--config", buildType]);

    // ── 7. Copy artifacts to build/native/ ────────────────────────────────
    // MSVC names the static archive <target>.lib (no lib prefix).
    const libSrc = join(INSTALL_DIR, "lib", "giovanni_native.lib");
    const headerSrc = join(INSTALL_DIR, "include", "giovanni_c.h");

    if (!existsSync(libSrc)) {
        throw new Error(`Expected library not found after install: ${libSrc}\n` + "Check the cmake build output above for errors.");
    }

    await cp(libSrc, join(OUTPUT_DIR, "giovanni_native.lib"));
    if (existsSync(headerSrc)) {
        await cp(headerSrc, join(OUTPUT_DIR, "giovanni_c.h"));
    }

    // ── 8. Copy vcpkg dep libs into build/native/ ────────────────────────────
    // MSVC static libs don't carry transitive dependency metadata. Copying qpdf
    // and its vcpkg deps alongside giovanni_native.lib lets build.rs discover
    // everything from one known directory without needing to know where vcpkg is.
    // In vcpkg manifest mode, CMake installs packages to <build_dir>/vcpkg_installed/,
    // not to <vcpkg_root>/installed/.
    const vcpkgLibDir = join(BUILD_DIR, "vcpkg_installed", VCPKG_TRIPLET, "lib");
    if (existsSync(vcpkgLibDir)) {
        const depLibs = readdirSync(vcpkgLibDir).filter((f) => f.endsWith(".lib"));
        for (const lib of depLibs) {
            await cp(join(vcpkgLibDir, lib), join(OUTPUT_DIR, lib));
        }
        console.log(`\n[giovanni] Copied ${depLibs.length} vcpkg dep lib(s) to build/native/`);
    }

    // ── 9. Copy gsdll64.dll + gsdll64.lib into build/native/ ────────────────
    // Unlike qpdf, Ghostscript is linked as a DLL import lib, not a static
    // archive. build.rs's "link every .lib in build/native/" loop needs
    // gsdll64.lib to resolve gsapi_* symbols at link time, and gsdll64.dll is
    // a genuine runtime dependency that must ship alongside the built .exe.
    if (ghostscript) {
        await cp(ghostscript.lib, join(OUTPUT_DIR, "gsdll64.lib"));
        await cp(ghostscript.dll, join(OUTPUT_DIR, "gsdll64.dll"));
        console.log("[giovanni] Copied gsdll64.lib + gsdll64.dll to build/native/ (the .dll is a runtime dependency — must ship with the app)");
    }

    console.log(`\n[giovanni] Done: build/native/giovanni_native.lib`);
}

main().catch((err: unknown) => {
    console.error("\n[giovanni] Windows native build failed:", (err as Error).message);
    process.exit(1);
});
