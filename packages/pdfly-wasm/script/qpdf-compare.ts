#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type Preset = {
    name: string;
    args: string[];
    note: string;
};

type Result = {
    name: string;
    outputPath: string;
    outputSize: number;
    savedBytes: number;
    savedPercent: number;
};

type QpdfBinary = {
    path: string;
    source: string;
};

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const packageDirectory = resolve(scriptDirectory, "..");
const repoDirectory = resolve(packageDirectory, "../..");
const qpdfSourceDirectory = join(repoDirectory, "vendor", "qpdf");
const workflowPath = join(repoDirectory, ".github", "workflows", "ci-cd.yml");

const [, , inputArg, outputDirArg] = process.argv;

if (!inputArg) {
    console.error("Usage: pnpm --filter @pdfly/wasm qpdf:compare <input.pdf> [output-dir]");
    process.exit(1);
}

const inputPath = resolve(process.cwd(), inputArg);

if (!existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
}

const qpdfVersion = getRequiredQpdfVersion();
const qpdfBinary = resolveQpdfBinary();
validateRequiredQpdfVersion(qpdfVersion);

const stem = basename(inputPath, extname(inputPath));
const outputDirectory = outputDirArg ? resolve(process.cwd(), outputDirArg) : resolve(process.cwd(), ".tmp", "qpdf-compare", `${stem}-${Date.now()}`);

mkdirSync(outputDirectory, { recursive: true });

const presets: Preset[] = [
    {
        name: "rewrite",
        args: [],
        note: "Plain rewrite with qpdf defaults",
    },
    {
        name: "wasm-defaultish",
        args: ["--compress-streams=y", "--decode-level=generalized", "--recompress-flate", "--compression-level=6", "--object-streams=generate"],
        note: "Close to the current wasm defaults",
    },
    {
        name: "max-losslessish",
        args: ["--compress-streams=y", "--decode-level=generalized", "--recompress-flate", "--compression-level=9", "--object-streams=generate"],
        note: "More aggressive structural compression",
    },
    {
        name: "linearized",
        args: ["--compress-streams=y", "--decode-level=generalized", "--recompress-flate", "--compression-level=9", "--object-streams=generate", "--linearize"],
        note: "Web-optimized output, not necessarily smaller",
    },
    {
        name: "image-optimized",
        args: ["--compress-streams=y", "--decode-level=generalized", "--recompress-flate", "--compression-level=9", "--object-streams=generate", "--optimize-images"],
        note: "May be lossy if qpdf decides JPEG recompression helps",
    },
];

const inputSize = statSync(inputPath).size;
const results: Result[] = [];

for (const preset of presets) {
    const outputPath = join(outputDirectory, `${stem}.${preset.name}.pdf`);
    const command = [qpdfBinary.path, inputPath, outputPath, ...preset.args].join(" ");

    console.log(`\n[${preset.name}] ${preset.note}`);
    console.log(command);

    execFileSync(qpdfBinary.path, [inputPath, outputPath, ...preset.args], { stdio: "inherit" });
    execFileSync(qpdfBinary.path, ["--check", outputPath], { stdio: "inherit" });

    const outputSize = statSync(outputPath).size;
    const savedBytes = inputSize - outputSize;
    const savedPercent = inputSize === 0 ? 0 : (savedBytes / inputSize) * 100;

    results.push({
        name: preset.name,
        outputPath,
        outputSize,
        savedBytes,
        savedPercent,
    });
}

console.log("\nSummary");
console.log(`qpdf:  ${qpdfBinary.path} (${qpdfBinary.source})`);
console.log(`Input:  ${inputPath}`);
console.log(`Output: ${outputDirectory}`);
console.log(`Size:   ${formatBytes(inputSize)} (${inputSize.toLocaleString()} bytes)\n`);
console.log([pad("preset", 18), pad("size", 14), pad("delta", 14), pad("saved", 9), "file"].join(" "));

for (const result of results) {
    const deltaLabel = result.savedBytes >= 0 ? `-${formatBytes(result.savedBytes)}` : `+${formatBytes(Math.abs(result.savedBytes))}`;

    console.log([pad(result.name, 18), pad(formatBytes(result.outputSize), 14), pad(deltaLabel, 14), pad(`${result.savedPercent.toFixed(1)}%`, 9), result.outputPath].join(" "));
}

function formatBytes(value: number): string {
    const units = ["B", "KB", "MB", "GB"];
    let size = value;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex += 1;
    }

    return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function pad(value: string | number, width: number): string {
    return String(value).padEnd(width, " ");
}

function getRequiredQpdfVersion(): string {
    const workflow = readFileSync(workflowPath, "utf8");
    const versionMatch = workflow.match(/^\s*QPDF_VERSION:\s*["']?([^"'\s#]+)["']?/m);

    if (!versionMatch) {
        console.error(`Could not read QPDF_VERSION from ${workflowPath}`);
        process.exit(1);
    }

    return versionMatch[1];
}

function resolveQpdfBinary(): QpdfBinary {
    if (process.env.QPDF_BIN) {
        ensureQpdfBinary(process.env.QPDF_BIN, "QPDF_BIN");

        return {
            path: process.env.QPDF_BIN,
            source: "QPDF_BIN",
        };
    }

    const binaryName = process.platform === "win32" ? "qpdf.exe" : "qpdf";
    const candidatePaths = [
        join(qpdfSourceDirectory, "build", "qpdf", binaryName),
        join(qpdfSourceDirectory, "build", "bin", binaryName),
        join(qpdfSourceDirectory, "cmake-build", "qpdf", binaryName),
        join(qpdfSourceDirectory, "cmake-build", "bin", binaryName),
    ];

    for (const candidatePath of candidatePaths) {
        if (existsSync(candidatePath)) {
            ensureQpdfBinary(candidatePath, "vendor/qpdf");

            return {
                path: candidatePath,
                source: "vendor/qpdf",
            };
        }
    }

    ensureQpdfBinary(binaryName, "PATH");

    return {
        path: binaryName,
        source: "PATH",
    };
}

function ensureQpdfBinary(qpdfPath: string, source: string): void {
    try {
        execFileSync(qpdfPath, ["--version"], { stdio: "ignore" });
    } catch {
        console.error(`qpdf from ${source} is not available.`);
        console.error(`Build the required native qpdf from ${qpdfSourceDirectory}, or set QPDF_BIN.`);
        process.exit(1);
    }
}

function validateRequiredQpdfVersion(requiredVersion: string): void {
    if (!existsSync(qpdfSourceDirectory)) {
        console.error(`Required qpdf source checkout is missing: ${qpdfSourceDirectory}`);
        console.error("Clone it with: git clone https://github.com/qpdf/qpdf.git vendor/qpdf");
        process.exit(1);
    }

    const actualVersion = execFileSync("git", ["-C", qpdfSourceDirectory, "rev-parse", "HEAD"], {
        encoding: "utf8",
    }).trim();

    if (actualVersion !== requiredVersion) {
        console.error(`vendor/qpdf is checked out at ${actualVersion}`);
        console.error(`Expected QPDF_VERSION from requirements: ${requiredVersion}`);
        console.error(`Run: git -C ${qpdfSourceDirectory} checkout ${requiredVersion}`);
        process.exit(1);
    }
}
