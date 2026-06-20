import { spawn } from "node:child_process";
import { access, mkdir, rename, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { VENDOR_PINS } from "./upstreams";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NativeBuildTarget = "native" | "jsi";
type RequestedTarget = NativeBuildTarget | "all";
type BuildMode = "dev" | "prd";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(scriptDirectory, "..", "..");
const repoRoot = resolve(packageRoot, "..", "..");
const defaultCacheRoot = resolve(repoRoot, ".tmp", "docker-buildx-cache");

// ---------------------------------------------------------------------------
// Target definitions
// ---------------------------------------------------------------------------

type NativeTargetConfig = {
    dockerfile: string;
    outputDirectory: string;
    resolveBuildArgs: (mode: BuildMode) => Record<string, string>;
};

const NATIVE_TARGETS: Record<NativeBuildTarget, NativeTargetConfig> = {
    /**
     * Standalone C library (giovanni_c.h + libgiovanni_native.a)
     * Usable from Python, Rust, Go, Swift, etc. via FFI.
     */
    native: {
        dockerfile: "packages/core/native/targets/native/docker.Dockerfile",
        outputDirectory: "build/native",
        resolveBuildArgs(mode) {
            return {
                NATIVE_BUILD_MODE: mode,
                QPDF_VERSION: VENDOR_PINS.qpdf.version,
                QPDF_ARCHIVE_URL: VENDOR_PINS.qpdf.archiveUrl,
                QPDF_SHA256: VENDOR_PINS.qpdf.sha256 ?? "",
                QPDF_JOBS: process.env.GIOVANNI_NATIVE_JOBS ?? "",
            };
        },
    },

    /**
     * React Native JSI shared library (libgiovanni_jsi.so + qpdf_jsi.h).
     * JSI headers are fetched from the react-native npm tarball inside Docker.
     * Override the React Native version with GIOVANNI_REACT_NATIVE_VERSION (default 0.76.0).
     */
    jsi: {
        dockerfile: "packages/core/native/targets/jsi/qpdf/docker.Dockerfile",
        outputDirectory: "build/jsi",
        resolveBuildArgs(mode) {
            return {
                JSI_BUILD_MODE: mode,
                QPDF_VERSION: VENDOR_PINS.qpdf.version,
                QPDF_ARCHIVE_URL: VENDOR_PINS.qpdf.archiveUrl,
                QPDF_SHA256: VENDOR_PINS.qpdf.sha256 ?? "",
                QPDF_JOBS: process.env.GIOVANNI_NATIVE_JOBS ?? "",
                REACT_NATIVE_VERSION: process.env.GIOVANNI_REACT_NATIVE_VERSION ?? "0.76.0",
            };
        },
    },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isRequestedTarget(value: string): value is RequestedTarget {
    return value === "all" || value in NATIVE_TARGETS;
}

function toDockerPath(path: string): string {
    return path.replaceAll("\\", "/");
}

async function pathExists(path: string): Promise<boolean> {
    try {
        await access(path);
        return true;
    } catch {
        return false;
    }
}

async function run(command: string, args: string[]): Promise<void> {
    await new Promise<void>((resolvePromise, rejectPromise) => {
        const child = spawn(command, args, { cwd: repoRoot, stdio: "inherit" });
        child.on("error", rejectPromise);
        child.on("exit", (code) => {
            if (code === 0) {
                resolvePromise();
                return;
            }
            rejectPromise(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "unknown"}`));
        });
    });
}

async function capture(command: string, args: string[]): Promise<string> {
    return new Promise<string>((resolvePromise, rejectPromise) => {
        const child = spawn(command, args, {
            cwd: repoRoot,
            stdio: ["ignore", "pipe", "inherit"],
        });
        let stdout = "";
        child.stdout.on("data", (chunk: Buffer | string) => {
            stdout += chunk.toString();
        });
        child.on("error", rejectPromise);
        child.on("exit", (code) => {
            if (code === 0) {
                resolvePromise(stdout);
                return;
            }
            rejectPromise(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "unknown"}`));
        });
    });
}

async function supportsLocalBuildCacheExport(): Promise<boolean> {
    try {
        const output = await capture("docker", ["buildx", "inspect"]);
        const driverLine = output
            .split("\n")
            .map((line) => line.trim())
            .find((line) => line.startsWith("Driver:"));
        const driver = driverLine?.split(":")[1]?.trim();
        return driver !== "docker";
    } catch {
        return false;
    }
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

async function buildTarget(name: NativeBuildTarget, mode: BuildMode, canExportBuildCache: boolean): Promise<void> {
    const config = NATIVE_TARGETS[name];
    const outputDirectory = resolve(packageRoot, config.outputDirectory);
    const cacheRoot = resolve(process.env.GIOVANNI_DOCKER_CACHE_ROOT ?? defaultCacheRoot, `${name}-${mode}`);
    const nextCacheRoot = `${cacheRoot}-next`;

    console.log(`\n[giovanni] Building native target: ${name} (${mode})`);
    console.log(`  Dockerfile : ${config.dockerfile}`);
    console.log(`  Output     : ${outputDirectory}`);

    await rm(outputDirectory, { recursive: true, force: true });
    await mkdir(outputDirectory, { recursive: true });
    if (canExportBuildCache) {
        await mkdir(dirname(cacheRoot), { recursive: true });
        await rm(nextCacheRoot, { recursive: true, force: true });
    }

    const dockerfile = toDockerPath(resolve(repoRoot, config.dockerfile));
    const buildArgs = config.resolveBuildArgs(mode);
    const dockerBuildArgs = Object.entries(buildArgs).flatMap(([key, value]) => ["--build-arg", `${key}=${value}`]);
    const cacheArgs = canExportBuildCache
        ? [
              ...((await pathExists(cacheRoot)) ? ["--cache-from", `type=local,src=${toDockerPath(cacheRoot)}`] : []),
              "--cache-to",
              `type=local,dest=${toDockerPath(nextCacheRoot)},mode=max`,
          ]
        : [];

    const dockerArgs = [
        "buildx",
        "build",
        "--file",
        dockerfile,
        ...dockerBuildArgs,
        ...cacheArgs,
        "--output",
        `type=local,dest=${toDockerPath(outputDirectory)}`,
        toDockerPath(repoRoot),
    ];

    await run("docker", dockerArgs);

    if (canExportBuildCache) {
        await rm(cacheRoot, { recursive: true, force: true });
        await rename(nextCacheRoot, cacheRoot);
    }

    console.log(`[giovanni] Done: ${name}`);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
    const rawArgs = process.argv.slice(2);
    const args = rawArgs[0] === "--" ? rawArgs.slice(1) : rawArgs;
    const [targetArg = "all", modeArg = "prd"] = args;

    if (!isRequestedTarget(targetArg)) {
        const valid = [...(Object.keys(NATIVE_TARGETS) as NativeBuildTarget[]), "all"];
        throw new Error(`Usage: build-native <${valid.join("|")}> <dev|prd>`);
    }
    if (modeArg !== "dev" && modeArg !== "prd") {
        throw new Error(`Unsupported build mode: ${modeArg}`);
    }

    const mode = modeArg as BuildMode;
    const targets: NativeBuildTarget[] = targetArg === "all" ? (Object.keys(NATIVE_TARGETS) as NativeBuildTarget[]) : [targetArg as NativeBuildTarget];

    const canExportBuildCache = await supportsLocalBuildCacheExport();
    for (const target of targets) {
        await buildTarget(target, mode, canExportBuildCache);
    }
}

main().catch((err) => {
    console.error("[giovanni] Native build failed:", err.message);
    process.exit(1);
});
