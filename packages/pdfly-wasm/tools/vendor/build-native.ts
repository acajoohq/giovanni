import { spawn } from "node:child_process";
import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Target definitions
// ---------------------------------------------------------------------------

type NativeBuildTarget = "native" | "jsi";
type RequestedTarget = NativeBuildTarget | "all";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(scriptDirectory, "..", "..");
const repoRoot = resolve(packageRoot, "..", "..");

const QPDF_SOURCE_DIR = resolve(repoRoot, "vendor", "qpdf");

type TargetConfig = {
    /** Source directory containing CMakeLists.txt */
    sourceDir: string;
    /** Where to copy the build artifacts after a successful build */
    outputDir: string;
    /** Extra cmake -D flags for this target */
    getCmakeArgs: () => string[];
};

const NATIVE_TARGETS: Record<NativeBuildTarget, TargetConfig> = {
    /**
     * Standalone C library (pdfly_c.h + libpdfly_native)
     * Usable from Python, Rust, Go, Swift, etc. via FFI.
     */
    native: {
        sourceDir: resolve(packageRoot, "native", "targets", "native"),
        outputDir: resolve(packageRoot, "build", "native"),
        getCmakeArgs() {
            const args = [`-DQPDF_SOURCE_DIR=${QPDF_SOURCE_DIR}`];
            if (process.env.PDFLY_NATIVE_SHARED === "1") {
                args.push("-DBUILD_SHARED_LIBS=ON");
            }
            return args;
        },
    },

    /**
     * React Native JSI shared library (pdfly_jsi)
     * Requires JSI headers — set PDFLY_JSI_INCLUDE_DIR to the
     * react-native ReactCommon directory (contains jsi/jsi.h).
     */
    jsi: {
        sourceDir: resolve(packageRoot, "native", "targets", "jsi", "qpdf"),
        outputDir: resolve(packageRoot, "build", "jsi"),
        getCmakeArgs() {
            const args = [`-DQPDF_SOURCE_DIR=${QPDF_SOURCE_DIR}`];
            const jsiInclude = process.env.PDFLY_JSI_INCLUDE_DIR;
            if (jsiInclude) {
                args.push(`-DJSI_INCLUDE_DIR=${jsiInclude}`);
            }
            return args;
        },
    },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isRequestedTarget(value: string): value is RequestedTarget {
    return value === "all" || value in NATIVE_TARGETS;
}

async function run(command: string, args: string[], cwd: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        const child = spawn(command, args, { cwd, stdio: "inherit" });
        child.on("error", reject);
        child.on("exit", (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "unknown"}`));
            }
        });
    });
}

async function buildTarget(name: NativeBuildTarget): Promise<void> {
    const config = NATIVE_TARGETS[name];
    const buildDir = resolve(config.sourceDir, "build");

    console.log(`\n[pdfly] Building native target: ${name}`);
    console.log(`  Source : ${config.sourceDir}`);
    console.log(`  Output : ${config.outputDir}`);
    console.log(`  qpdf   : ${QPDF_SOURCE_DIR}`);

    await mkdir(buildDir, { recursive: true });
    await mkdir(config.outputDir, { recursive: true });

    const jobs = process.env.PDFLY_NATIVE_JOBS ?? String(4);

    // Configure
    await run("cmake", [config.sourceDir, ...config.getCmakeArgs()], buildDir);

    // Build
    await run("cmake", ["--build", ".", "--parallel", jobs], buildDir);

    // Copy public header(s) to the output directory
    try {
        if (name === "native") {
            await cp(resolve(config.sourceDir, "pdfly_c.h"), resolve(config.outputDir, "pdfly_c.h"));
        }
        if (name === "jsi") {
            await cp(resolve(packageRoot, "native", "targets", "jsi", "qpdf", "qpdf_jsi.h"), resolve(config.outputDir, "qpdf_jsi.h"));
        }
    } catch {
        // Header copy is best-effort; the main artifact is in the build dir
    }

    console.log(`[pdfly] Done: ${name}`);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
    const rawArgs = process.argv.slice(2);
    const args = rawArgs[0] === "--" ? rawArgs.slice(1) : rawArgs;
    const [targetArg = "all"] = args;

    if (!isRequestedTarget(targetArg)) {
        const valid = [...(Object.keys(NATIVE_TARGETS) as NativeBuildTarget[]), "all"];
        throw new Error(`Unknown target "${targetArg}". Valid targets: ${valid.join(", ")}`);
    }

    const targets: NativeBuildTarget[] = targetArg === "all" ? (Object.keys(NATIVE_TARGETS) as NativeBuildTarget[]) : [targetArg];

    for (const target of targets) {
        await buildTarget(target);
    }
}

main().catch((err) => {
    console.error("[pdfly] Native build failed:", err.message);
    process.exit(1);
});
