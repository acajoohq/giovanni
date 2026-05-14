/**
 * Run the Ghostscript WASM spike against a local PDF fixture using MEMFS.
 *
 * Usage:
 *   node --experimental-strip-types tools/dev/ghostscript-smoke.ts <input.pdf> <output.pdf> [preset]
 *
 * Presets:
 *   screen | ebook | printer | prepress | default
 */

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

type GhostscriptPreset = "screen" | "ebook" | "printer" | "prepress" | "default";

type GhostscriptModuleFactory = (options: GhostscriptModuleOptions) => Promise<GhostscriptModule>;

type GhostscriptModuleOptions = {
    noInitialRun: boolean;
    locateFile: (path: string) => string;
    print: (line: string) => void;
    printErr: (line: string) => void;
};

type GhostscriptModule = {
    FS: {
        writeFile: (path: string, data: Uint8Array) => void;
        readFile: (path: string) => Uint8Array;
    };
    callMain: (args: string[]) => number;
};

const [, , inputPath, outputPath, presetArg = "ebook"] = process.argv;

if (!inputPath || !outputPath) {
    console.error("Usage: ghostscript-smoke <input.pdf> <output.pdf> [preset]");
    process.exit(1);
}

const allowedPresets = new Set<GhostscriptPreset>(["screen", "ebook", "printer", "prepress", "default"]);
if (!allowedPresets.has(presetArg as GhostscriptPreset)) {
    console.error(`Unsupported preset: ${presetArg}`);
    console.error(`Expected one of: ${Array.from(allowedPresets).join(", ")}`);
    process.exit(1);
}

const preset = presetArg as GhostscriptPreset;
const modulePath = pathToFileURL(resolve("build/ghostscript/ghostscript.js")).href;
const imported = (await import(modulePath)) as { default?: GhostscriptModuleFactory };
const createGhostscriptModule = imported.default;

if (typeof createGhostscriptModule !== "function") {
    throw new TypeError("ghostscript.js did not export a module factory function");
}

const logs: string[] = [];
const errors: string[] = [];

const module = await createGhostscriptModule({
    noInitialRun: true,
    locateFile(path) {
        if (path === "gs.wasm") {
            return pathToFileURL(resolve("build/ghostscript/ghostscript.wasm")).href;
        }

        return pathToFileURL(resolve("build/ghostscript", path)).href;
    },
    print(line) {
        logs.push(String(line));
    },
    printErr(line) {
        errors.push(String(line));
    },
});

const inputBytes = await readFile(inputPath);
const inputMemfsPath = "/input.pdf";
const outputMemfsPath = "/output.pdf";

module.FS.writeFile(inputMemfsPath, inputBytes);

const args = [
    "-sDEVICE=pdfwrite",
    "-dBATCH",
    "-dNOPAUSE",
    "-dSAFER",
    "-dQUIET",
    `-dPDFSETTINGS=/${preset}`,
    `-sOutputFile=${outputMemfsPath}`,
    inputMemfsPath,
];

const startedAt = Date.now();
const exitCode = module.callMain(args);
const elapsedMs = Date.now() - startedAt;

if (exitCode !== 0) {
    if (errors.length > 0) {
        console.error(errors.join("\n"));
    }
    throw new Error(`Ghostscript exited with code ${exitCode}`);
}

const outputBytes = module.FS.readFile(outputMemfsPath);
await writeFile(outputPath, outputBytes);

const sizeDelta = inputBytes.byteLength - outputBytes.byteLength;
const sizeDeltaPercent = inputBytes.byteLength === 0 ? 0 : (sizeDelta / inputBytes.byteLength) * 100;

console.log(`Preset: ${preset}`);
console.log(`Input:  ${inputBytes.byteLength} bytes`);
console.log(`Output: ${outputBytes.byteLength} bytes`);
console.log(`Delta:  ${sizeDelta} bytes (${sizeDeltaPercent.toFixed(1)}%)`);
console.log(`Time:   ${elapsedMs}ms`);

if (logs.length > 0) {
    console.log("\nGhostscript output:");
    console.log(logs.join("\n"));
}

if (errors.length > 0) {
    console.error("\nGhostscript stderr:");
    console.error(errors.join("\n"));
}
