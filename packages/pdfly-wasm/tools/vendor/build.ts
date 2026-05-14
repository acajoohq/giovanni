import { spawn } from "node:child_process";
import { access, mkdir, rename, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { VENDOR_PINS } from "./upstreams.js";

type BuildMode = "dev" | "prd";
type BuildTarget = "qpdf" | "ghostscript";
type RequestedTarget = BuildTarget | "all";

type BuildTargetConfig = {
    dockerfile: string;
    outputDirectory: string;
    resolveBuildArgs: (mode: BuildMode) => Record<string, string>;
};

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(scriptDirectory, "..", "..");
const repoRoot = resolve(packageRoot, "..", "..");
const defaultCacheRoot = resolve(repoRoot, ".tmp", "docker-buildx-cache");

const BUILD_TARGETS: Record<BuildTarget, BuildTargetConfig> = {
    qpdf: {
        dockerfile: "native/docker/qpdf.Dockerfile",
        outputDirectory: "build/qpdf",
        resolveBuildArgs(mode) {
            return {
                QPDF_BUILD_MODE: mode,
                QPDF_VERSION: VENDOR_PINS.qpdf.version,
                QPDF_ARCHIVE_URL: VENDOR_PINS.qpdf.archiveUrl,
                QPDF_SHA256: VENDOR_PINS.qpdf.sha256 ?? "",
                QPDF_JOBS: process.env.PDFLY_QPDF_JOBS ?? "",
            };
        },
    },
    ghostscript: {
        dockerfile: "native/docker/ghostscript.Dockerfile",
        outputDirectory: "build/ghostscript",
        resolveBuildArgs(mode) {
            return {
                GHOSTSCRIPT_BUILD_MODE: mode,
                GHOSTPDL_VERSION: VENDOR_PINS.ghostpdl.version,
                GHOSTPDL_ARCHIVE_URL: VENDOR_PINS.ghostpdl.archiveUrl,
                GHOSTPDL_SHA256: VENDOR_PINS.ghostpdl.sha256 ?? "",
                JOBS: process.env.PDFLY_GHOSTSCRIPT_JOBS ?? "",
            };
        },
    },
};

async function main(): Promise<void> {
    const rawArgs = process.argv.slice(2);
    const args = rawArgs[0] === "--" ? rawArgs.slice(1) : rawArgs;
    const [targetArg, modeArg = "prd"] = args;

    if (!targetArg || !isRequestedTarget(targetArg)) {
        throw new Error(`Usage: build-vendor <${[...Object.keys(BUILD_TARGETS), "all"].join("|")}> <dev|prd>`);
    }
    if (modeArg !== "dev" && modeArg !== "prd") {
        throw new Error(`Unsupported build mode: ${modeArg}`);
    }

    const mode = modeArg as BuildMode;
    const targets = targetArg === "all" ? (Object.keys(BUILD_TARGETS) as BuildTarget[]) : [targetArg];

    const canExportBuildCache = await supportsLocalBuildCacheExport();
    await Promise.all(targets.map((target) => buildTarget(target, mode, canExportBuildCache)));
}

async function buildTarget(target: BuildTarget, mode: BuildMode, canExportBuildCache: boolean): Promise<void> {
    const config = BUILD_TARGETS[target];
    const outputDirectory = resolve(packageRoot, config.outputDirectory);
    const cacheRoot = resolve(process.env.PDFLY_DOCKER_CACHE_ROOT ?? defaultCacheRoot, `${target}-${mode}`);
    const nextCacheRoot = `${cacheRoot}-next`;

    await rm(outputDirectory, { recursive: true, force: true });
    await mkdir(outputDirectory, { recursive: true });
    if (canExportBuildCache) {
        await mkdir(dirname(cacheRoot), { recursive: true });
        await rm(nextCacheRoot, { recursive: true, force: true });
    }

    const dockerfile = toDockerPath(resolve(packageRoot, config.dockerfile));
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

    console.log(`Building ${target} (${mode}) with Docker`);
    await run("docker", dockerArgs);

    if (canExportBuildCache) {
        await rm(cacheRoot, { recursive: true, force: true });
        await rename(nextCacheRoot, cacheRoot);
    }
}

async function run(command: string, args: string[]): Promise<void> {
    await new Promise<void>((resolvePromise, rejectPromise) => {
        const child = spawn(command, args, {
            cwd: packageRoot,
            stdio: "inherit",
        });

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

async function pathExists(path: string): Promise<boolean> {
    try {
        await access(path);
        return true;
    } catch {
        return false;
    }
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

function isRequestedTarget(value: string): value is RequestedTarget {
    return value === "all" || value in BUILD_TARGETS;
}

function toDockerPath(path: string): string {
    return path.replaceAll("\\", "/");
}

async function capture(command: string, args: string[]): Promise<string> {
    return new Promise<string>((resolvePromise, rejectPromise) => {
        const child = spawn(command, args, {
            cwd: packageRoot,
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

await main();
