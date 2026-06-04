/**
 * Release-package verification for `package:check`.
 *
 * Expects `dist/` to already contain the bundled JS entrypoints and copied WASM
 * artifacts. Fails if required artifacts are missing or if the root, qpdf, and
 * Ghostscript exports cannot run compression against a PDF fixture.
 */

import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const toolsDirectory = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(toolsDirectory, "..", "..");
const distRoot = resolve(packageRoot, "dist");

const artifactFiles = ["qpdf.js", "qpdf.wasm", "ghostscript.js", "ghostscript.wasm"] as const;

type PdflyWasmModule = {
    compressPdf: (
        input: Uint8Array,
        options:
            | { engine: "qpdf"; preset: "default" }
            | {
                  engine: "ghostscript";
                  preset: "default";
                  compatibilityLevel: "1.7";
                  colorConversionStrategy: "LeaveColorUnchanged";
                  downsampleColorImages: true;
                  downsampleGrayImages: true;
                  colorImageResolution: 144;
                  grayImageResolution: 144;
                  jpegQuality: 75;
              },
    ) => Promise<{ compressedSize: number; data: Uint8Array }>;
    getAvailableCompressionEngines: () => string[];
};

type PdflyQpdfModule = {
    getQpdfVersion: () => Promise<string>;
    optimizePdf: (input: Uint8Array, options?: { preset?: "default" | "web" | "archive" }) => Promise<{ compressedSize: number; data: Uint8Array }>;
};

type PdflyGhostscriptModule = {
    getGhostscriptVersion: () => Promise<string>;
    compressPdfWithGhostscript: (
        input: Uint8Array,
        options: {
            preset: "default";
            compatibilityLevel: "1.7";
            colorConversionStrategy: "LeaveColorUnchanged";
            downsampleColorImages: true;
            downsampleGrayImages: true;
            colorImageResolution: 144;
            grayImageResolution: 144;
            jpegQuality: 75;
        },
    ) => Promise<{ compressedSize: number; data: Uint8Array }>;
};

async function main(): Promise<void> {
    await verifyArtifacts();
    await verifyBuiltPackageRuntime();
}

async function verifyArtifacts(): Promise<void> {
    for (const file of artifactFiles) {
        const artifactPath = resolve(distRoot, file);
        await access(artifactPath);
        const artifactStats = await stat(artifactPath);
        assert(artifactStats.size > 0, `${file} was copied to dist but is empty`);
    }
}

async function verifyBuiltPackageRuntime(): Promise<void> {
    const moduleUrl = pathToFileURL(resolve(distRoot, "index.mjs")).href;
    const qpdfModuleUrl = pathToFileURL(resolve(distRoot, "qpdf.mjs")).href;
    const ghostscriptModuleUrl = pathToFileURL(resolve(distRoot, "ghostscript.mjs")).href;
    const pdflyWasm = (await import(moduleUrl)) as PdflyWasmModule;
    const pdflyQpdf = (await import(qpdfModuleUrl)) as PdflyQpdfModule;
    const pdflyGhostscript = (await import(ghostscriptModuleUrl)) as PdflyGhostscriptModule;

    assert.deepEqual(pdflyWasm.getAvailableCompressionEngines().sort(), ["ghostscript", "qpdf"]);

    const fixturePath = resolve(packageRoot, "src/test/fixtures/pdfs/upstream/qpdf/filter-on-write.pdf");
    const input = new Uint8Array(await readFile(fixturePath));

    const qpdfResult = await pdflyWasm.compressPdf(input, { engine: "qpdf", preset: "default" });
    const ghostscriptResult = await pdflyWasm.compressPdf(input, {
        engine: "ghostscript",
        preset: "default",
        compatibilityLevel: "1.7",
        colorConversionStrategy: "LeaveColorUnchanged",
        downsampleColorImages: true,
        downsampleGrayImages: true,
        colorImageResolution: 144,
        grayImageResolution: 144,
        jpegQuality: 75,
    });
    const qpdfSubpathResult = await pdflyQpdf.optimizePdf(input, { preset: "default" });
    const ghostscriptSubpathResult = await pdflyGhostscript.compressPdfWithGhostscript(input, {
        preset: "default",
        compatibilityLevel: "1.7",
        colorConversionStrategy: "LeaveColorUnchanged",
        downsampleColorImages: true,
        downsampleGrayImages: true,
        colorImageResolution: 144,
        grayImageResolution: 144,
        jpegQuality: 75,
    });

    assert(isPdfBytes(qpdfResult.data), "qpdf build artifact did not produce a valid PDF header");
    assert(isPdfBytes(ghostscriptResult.data), "ghostscript build artifact did not produce a valid PDF header");
    assert(isPdfBytes(qpdfSubpathResult.data), "qpdf subpath build artifact did not produce a valid PDF header");
    assert(isPdfBytes(ghostscriptSubpathResult.data), "ghostscript subpath build artifact did not produce a valid PDF header");
    assert(qpdfResult.compressedSize > 0, "qpdf compressed result is empty");
    assert(ghostscriptResult.compressedSize > 0, "ghostscript compressed result is empty");
    assert(qpdfSubpathResult.compressedSize > 0, "qpdf subpath compressed result is empty");
    assert(ghostscriptSubpathResult.compressedSize > 0, "ghostscript subpath compressed result is empty");
    assert.equal(typeof (await pdflyQpdf.getQpdfVersion()), "string");
    assert.equal(typeof (await pdflyGhostscript.getGhostscriptVersion()), "string");

    console.log(
        JSON.stringify(
            {
                fixturePath,
                inputBytes: input.byteLength,
                qpdfBytes: qpdfResult.compressedSize,
                ghostscriptBytes: ghostscriptResult.compressedSize,
            },
            null,
            2,
        ),
    );
}

function isPdfBytes(data: Uint8Array): boolean {
    const header = new TextDecoder("ascii").decode(data.subarray(0, 5));
    return header === "%PDF-";
}

await main();
