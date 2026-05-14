import { execFileSync } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { VENDOR_PINS } from "./upstreams.ts";

type BuildMode = "dev" | "prd";
type BuildTarget = "qpdf" | "ghostscript";

type BuildTargetConfig = {
    dockerfile: string;
    outputDirectory: string;
    resolveBuildArgs: (mode: BuildMode) => Record<string, string>;
};

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(scriptDirectory, "..", "..");
const repoRoot = resolve(packageRoot, "..", "..");

const BUILD_TARGETS: Record<BuildTarget, BuildTargetConfig> = {
    qpdf: {
        dockerfile: "vendor-build/docker/qpdf.Dockerfile",
        outputDirectory: "build/qpdf",
        resolveBuildArgs(mode) {
            return {
                QPDF_BUILD_MODE: mode,
                QPDF_VERSION: VENDOR_PINS.qpdf.version,
                QPDF_ARCHIVE_URL: VENDOR_PINS.qpdf.archiveUrl,
                QPDF_SHA256: VENDOR_PINS.qpdf.sha256 ?? "",
            };
        },
    },
    ghostscript: {
        dockerfile: "vendor-build/docker/ghostscript.Dockerfile",
        outputDirectory: "build/ghostscript",
        resolveBuildArgs(mode) {
            return {
                GHOSTSCRIPT_BUILD_MODE: mode,
                GHOSTPDL_VERSION: VENDOR_PINS.ghostpdl.version,
                GHOSTPDL_ARCHIVE_URL: VENDOR_PINS.ghostpdl.archiveUrl,
                GHOSTPDL_SHA256: VENDOR_PINS.ghostpdl.sha256 ?? "",
                JOBS: process.env.PDFLY_GHOSTSCRIPT_JOBS ?? "1",
            };
        },
    },
};

async function main(): Promise<void> {
    const rawArgs = process.argv.slice(2);
    const args = rawArgs[0] === "--" ? rawArgs.slice(1) : rawArgs;
    const [targetArg, modeArg = "prd"] = args;

    if (!targetArg || !(targetArg in BUILD_TARGETS)) {
        throw new Error(`Usage: build-vendor <${Object.keys(BUILD_TARGETS).join("|")}> <dev|prd>`);
    }
    if (modeArg !== "dev" && modeArg !== "prd") {
        throw new Error(`Unsupported build mode: ${modeArg}`);
    }

    const target = targetArg as BuildTarget;
    const mode = modeArg as BuildMode;
    const config = BUILD_TARGETS[target];

    const outputDirectory = resolve(packageRoot, config.outputDirectory);
    await rm(outputDirectory, { recursive: true, force: true });
    await mkdir(outputDirectory, { recursive: true });

    const dockerfile = toDockerPath(resolve(packageRoot, config.dockerfile));
    const buildArgs = config.resolveBuildArgs(mode);
    const dockerBuildArgs = Object.entries(buildArgs).flatMap(([key, value]) => ["--build-arg", `${key}=${value}`]);
    const dockerArgs = [
        "buildx",
        "build",
        "--file",
        dockerfile,
        ...dockerBuildArgs,
        "--output",
        `type=local,dest=${toDockerPath(outputDirectory)}`,
        toDockerPath(repoRoot),
    ];

    console.log(`Building ${target} (${mode}) with Docker`);
    execFileSync("docker", dockerArgs, { cwd: packageRoot, stdio: "inherit" });
}

function toDockerPath(path: string): string {
    return path.replaceAll("\\", "/");
}

await main();
