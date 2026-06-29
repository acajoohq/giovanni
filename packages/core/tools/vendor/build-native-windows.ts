/**
 * Windows-native CMake build of giovanni_native.lib.
 *
 * Uses vcpkg to supply qpdf — no Docker, no manual setup required.
 * On first run, bootstraps a project-local vcpkg under .tmp/vcpkg.
 * Produces build/native/giovanni_native.lib + giovanni_c.h.
 *
 * Usage:
 *   pnpm --filter @giovanni/core build:native:win [dev|prd]
 *
 * Prerequisites:
 *   - git   (to clone vcpkg on first run if not already present)
 *   - MSVC  (Visual Studio 2022 with C++ Desktop workload)
 *   - cmake (bundled with VS 2022, or install separately)
 *
 * Optional env vars:
 *   VCPKG_ROOT              — use an existing standalone vcpkg instead of bootstrapping
 *   GIOVANNI_VCPKG_TRIPLET  — override triplet (default: x64-windows-static)
 *   GIOVANNI_CMAKE_GENERATOR — override generator (default: Visual Studio 17 2022)
 *   GIOVANNI_NATIVE_JOBS    — cmake --parallel value
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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
        child.stdout?.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
        child.on("error", reject);
        child.on("exit", (code) => {
            if (code === 0) resolve(stdout.trim());
            else reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "unknown"}`));
        });
    });
}

// ---------------------------------------------------------------------------
// CMake discovery
// ---------------------------------------------------------------------------

function findCmake(): string {
    const vsCmakePaths = [
        "C:\\Program Files\\Microsoft Visual Studio\\2022\\Community",
        "C:\\Program Files\\Microsoft Visual Studio\\2022\\Enterprise",
        "C:\\Program Files\\Microsoft Visual Studio\\2022\\Professional",
        "C:\\Program Files\\Microsoft Visual Studio\\18\\Community",
        "C:\\Program Files\\Microsoft Visual Studio\\18\\Enterprise",
        "C:\\Program Files\\Microsoft Visual Studio\\18\\Professional",
    ].map((vs) =>
        join(vs, "Common7", "IDE", "CommonExtensions", "Microsoft", "CMake", "CMake", "bin", "cmake.exe"),
    );

    for (const p of vsCmakePaths) {
        if (existsSync(p)) return p;
    }

    // Fall back to whatever cmake is in PATH
    return "cmake";
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
        await run("git", [
            "clone",
            "--depth=1",
            "https://github.com/microsoft/vcpkg.git",
            LOCAL_VCPKG,
        ]);
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
    const generator = process.env.GIOVANNI_CMAKE_GENERATOR ?? "Visual Studio 17 2022";
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
    console.log("\n[giovanni] cmake configure...");
    await run(cmake, [
        "-S", NATIVE_TARGET_DIR,
        "-B", BUILD_DIR,
        "-G", generator,
        "-A", "x64",
        `-DCMAKE_TOOLCHAIN_FILE=${toolchain}`,
        `-DVCPKG_TARGET_TRIPLET=${VCPKG_TRIPLET}`,
        `-DVCPKG_MANIFEST_DIR=${BUILD_DIR}`,
        "-DGIOVANNI_USE_SYSTEM_QPDF=ON",
        "-DBUILD_SHARED_LIBS=OFF",
        `-DCMAKE_INSTALL_PREFIX=${INSTALL_DIR}`,
    ]);

    // ── 5. CMake build ─────────────────────────────────────────────────────
    console.log(`\n[giovanni] cmake build (${buildType})...`);
    await run(cmake, [
        "--build", BUILD_DIR,
        "--config", buildType,
        "--target", "giovanni_native",
        ...(jobs ? ["--parallel", jobs] : ["--parallel"]),
    ]);

    // ── 6. CMake install ───────────────────────────────────────────────────
    console.log("\n[giovanni] cmake install...");
    await run(cmake, ["--install", BUILD_DIR, "--config", buildType]);

    // ── 7. Copy artifacts to build/native/ ────────────────────────────────
    // MSVC names the static archive <target>.lib (no lib prefix).
    const libSrc = join(INSTALL_DIR, "lib", "giovanni_native.lib");
    const headerSrc = join(INSTALL_DIR, "include", "giovanni_c.h");

    if (!existsSync(libSrc)) {
        throw new Error(
            `Expected library not found after install: ${libSrc}\n` +
            "Check the cmake build output above for errors.",
        );
    }

    await cp(libSrc, join(OUTPUT_DIR, "giovanni_native.lib"));
    if (existsSync(headerSrc)) {
        await cp(headerSrc, join(OUTPUT_DIR, "giovanni_c.h"));
    }

    console.log(`\n[giovanni] Done: build/native/giovanni_native.lib`);
}

main().catch((err: unknown) => {
    console.error("\n[giovanni] Windows native build failed:", (err as Error).message);
    process.exit(1);
});
