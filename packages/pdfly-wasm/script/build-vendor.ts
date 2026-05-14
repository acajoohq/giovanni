import { execFileSync } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BUILD_TARGETS, type BuildMode, type BuildTarget } from "./vendor-config.ts";
import { ensureVendor } from "./sync-vendors.ts";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(scriptDirectory, "..");
const repoRoot = resolve(packageRoot, "..", "..");

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

    await ensureVendor(config.vendor);

    const outputDirectory = resolve(packageRoot, config.outputDirectory);
    await rm(outputDirectory, { recursive: true, force: true });
    await mkdir(outputDirectory, { recursive: true });

    const dockerfile = resolve(packageRoot, config.dockerfile);

    const dockerArgs = [
        "buildx",
        "build",
        "--file",
        dockerfile,
        "--build-arg",
        `${config.dockerBuildArg}=${mode}`,
        "--output",
        `type=local,dest=${outputDirectory}`,
        repoRoot,
    ];

    console.log(`Building ${target} (${mode}) with Docker`);
    execFileSync("docker", dockerArgs, { cwd: packageRoot, stdio: "inherit" });
}

await main();
