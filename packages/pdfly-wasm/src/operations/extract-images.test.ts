/// <reference types="node" />

import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import type { QpdfWasmModule, WasmExtractedImage } from "../types/wasm-module.js";

let modulePromise: Promise<QpdfWasmModule> | null = null;

describe("extractImages WASM filter decoding", () => {
    it.each([
        {
            name: "plain DCTDecode",
            fixture: "dct-plain.pdf",
        },
        {
            name: "ASCII85-wrapped DCTDecode",
            fixture: "dct-ascii85-wrapper.pdf",
        },
        {
            name: "Flate-wrapped DCTDecode",
            fixture: "dct-flate-wrapper.pdf",
        },
        {
            name: "RunLength-wrapped DCTDecode",
            fixture: "dct-runlength-wrapper.pdf",
        },
    ])("returns browser-decodable JPEG bytes for $name", async ({ fixture }) => {
        const image = await extractSingleRawImage(await loadFixture(fixture));

        expect(image.filter).toBe("DCTDecode");
        expect(image.strategy).toBe("encoded");
        expect(hasJpegMagic(image.bytes)).toBe(true);
    });

    it.each([
        {
            name: "Mozilla PDF.js ASCIIHexDecode fixture",
            fixture: "upstream/pdfjs/asciihexdecode.pdf",
        },
        {
            name: "py-pdf ImageMagick images fixture",
            fixture: "upstream/pypdf/imagemagick-images.pdf",
        },
        {
            name: "PDFium rectangles fixture",
            fixture: "upstream/pdfium/rectangles.pdf",
        },
        {
            name: "qpdf filter-on-write fixture",
            fixture: "upstream/qpdf/filter-on-write.pdf",
        },
    ])("handles upstream fixture: $name", async ({ fixture }) => {
        const module = await loadQpdfModule();
        const images = module.extractImages(await loadFixture(fixture));

        for (const image of images) {
            expect(image.width).toBeGreaterThan(0);
            expect(image.height).toBeGreaterThan(0);
            expect(typeof image.filter).toBe("string");
            expect(image.bytes).toBeInstanceOf(Uint8Array);
        }
    });
});

async function extractSingleRawImage(pdfBytes: Uint8Array): Promise<WasmExtractedImage> {
    const module = await loadQpdfModule();
    const images = module.extractImages(pdfBytes);

    expect(images).toHaveLength(1);

    const image = images[0];
    if (!image) throw new Error("Expected one image");
    return image;
}

async function loadQpdfModule(): Promise<QpdfWasmModule> {
    modulePromise ??= (async () => {
        const moduleUrl = new URL("../../build/qpdf/qpdf.js", import.meta.url).href;
        const imported = (await import(/* @vite-ignore */ moduleUrl)) as { default?: () => Promise<QpdfWasmModule>; createQpdfModule?: () => Promise<QpdfWasmModule> };
        const createQpdfModule = imported.default ?? imported.createQpdfModule;

        if (typeof createQpdfModule !== "function") {
            throw new TypeError("qpdf.js did not export a module factory function");
        }

        return createQpdfModule();
    })();

    return modulePromise;
}

async function loadFixture(fileName: string): Promise<Uint8Array> {
    const fixturePath = fileName.includes("/") ? fileName : `extract-images/${fileName}`;
    const fileUrl = new URL(`../test/fixtures/pdfs/${fixturePath}`, import.meta.url);

    return new Uint8Array(await readFile(fileUrl));
}

function hasJpegMagic(data: Uint8Array): boolean {
    return data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
}
