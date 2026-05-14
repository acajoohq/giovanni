/**
 * Run the Ghostscript WASM spike against a local PDF fixture using the native
 * gsapi-backed rewrite wrapper.
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
};

type GhostscriptModule = {
    rewritePdf: (data: Uint8Array, args: string[]) => Uint8Array;
    getVersion: () => string;
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

const module = await createGhostscriptModule({
    noInitialRun: true,
    locateFile(path) {
        if (path === "gs.wasm") {
            return pathToFileURL(resolve("build/ghostscript/ghostscript.wasm")).href;
        }

        return pathToFileURL(resolve("build/ghostscript", path)).href;
    },
});

const inputBytes = await readFile(inputPath);

const args = [
    "-sDEVICE=pdfwrite",
    "-dBATCH",
    "-dNOPAUSE",
    "-dSAFER",
    "-dQUIET",
    `-dPDFSETTINGS=/${preset}`,
];

const startedAt = Date.now();
const outputBytes = module.rewritePdf(inputBytes, args);
const elapsedMs = Date.now() - startedAt;
await writeFile(outputPath, outputBytes);

const sizeDelta = inputBytes.byteLength - outputBytes.byteLength;
const sizeDeltaPercent = inputBytes.byteLength === 0 ? 0 : (sizeDelta / inputBytes.byteLength) * 100;

console.log(`Preset: ${preset}`);
console.log(`Input:  ${inputBytes.byteLength} bytes`);
console.log(`Output: ${outputBytes.byteLength} bytes`);
console.log(`Delta:  ${sizeDelta} bytes (${sizeDeltaPercent.toFixed(1)}%)`);
console.log(`Time:   ${elapsedMs}ms`);
