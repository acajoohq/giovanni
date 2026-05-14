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
            | { engine: "qpdf"; preset: "web" }
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
    const pdflyWasm = (await import(moduleUrl)) as PdflyWasmModule;

    assert.deepEqual(pdflyWasm.getAvailableCompressionEngines().sort(), ["ghostscript", "qpdf"]);

    const fixturePath = resolve(packageRoot, "src/test/fixtures/pdfs/upstream/pypdf/imagemagick-images.pdf");
    const input = new Uint8Array(await readFile(fixturePath));

    const qpdfResult = await pdflyWasm.compressPdf(input, { engine: "qpdf", preset: "web" });
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

    assert(isPdfBytes(qpdfResult.data), "qpdf build artifact did not produce a valid PDF header");
    assert(isPdfBytes(ghostscriptResult.data), "ghostscript build artifact did not produce a valid PDF header");
    assert(qpdfResult.compressedSize > 0, "qpdf compressed result is empty");
    assert(ghostscriptResult.compressedSize > 0, "ghostscript compressed result is empty");

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
