import { describe, expect, it } from "vitest";
import type { QpdfWasmModule, WasmExtractedImage } from "../types/wasm-module.js";

const textEncoder = new TextEncoder();
const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0xff, 0xd9]);
const flateWrappedJpegBytes = new Uint8Array([120, 156, 251, 127, 227, 255, 3, 6, 1, 47, 55, 79, 55, 134, 255, 55, 1, 52, 91, 6, 190]);

let modulePromise: Promise<QpdfWasmModule> | null = null;

describe("extractImages WASM filter decoding", () => {
    it.each([
        {
            name: "plain DCTDecode",
            filter: "/DCTDecode",
            streamData: jpegBytes,
        },
        {
            name: "ASCII85-wrapped DCTDecode",
            filter: "[/ASCII85Decode /DCTDecode]",
            streamData: ascii85Encode(jpegBytes),
        },
        {
            name: "Flate-wrapped DCTDecode",
            filter: "[/FlateDecode /DCTDecode]",
            streamData: flateWrappedJpegBytes,
        },
        {
            name: "RunLength-wrapped DCTDecode",
            filter: "[/RunLengthDecode /DCTDecode]",
            streamData: runLengthEncode(jpegBytes),
        },
    ])("returns browser-decodable JPEG bytes for $name", async ({ filter, streamData }) => {
        const image = await extractSingleRawImage(buildPdfWithImage(filter, streamData));

        expect(image.filter).toBe("DCTDecode");
        expect(image.strategy).toBe("encoded");
        expect(hasJpegMagic(image.bytes)).toBe(true);
    });
});

async function extractSingleRawImage(pdfBytes: Uint8Array): Promise<WasmExtractedImage> {
    const module = await loadQpdfModule();
    const images = module.extractImages(pdfBytes);

    expect(images).toHaveLength(1);

    return images[0]!;
}

async function loadQpdfModule(): Promise<QpdfWasmModule> {
    modulePromise ??= (async () => {
        const moduleUrl = new URL("../../build/wasm/qpdf.js", import.meta.url).href;
        const imported = (await import(/* @vite-ignore */ moduleUrl)) as { default?: () => Promise<QpdfWasmModule>; createQpdfModule?: () => Promise<QpdfWasmModule> };
        const createQpdfModule = imported.default ?? imported.createQpdfModule;

        if (typeof createQpdfModule !== "function") {
            throw new TypeError("qpdf.js did not export a module factory function");
        }

        return createQpdfModule();
    })();

    return modulePromise;
}

function buildPdfWithImage(filter: string, imageData: Uint8Array): Uint8Array {
    const content = textEncoder.encode("q\n1 0 0 1 0 0 cm\n/Im1 Do\nQ\n");
    const objects = [
        ascii("<< /Type /Catalog /Pages 2 0 R >>"),
        ascii("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
        ascii("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 1 1] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>"),
        streamObject(`<< /Type /XObject /Subtype /Image /Width 1 /Height 1 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter ${filter} /Length ${imageData.length} >>`, imageData),
        streamObject(`<< /Length ${content.length} >>`, content),
    ];

    const chunks: Uint8Array[] = [ascii("%PDF-1.7\n")];
    const offsets = [0];

    for (const [index, object] of objects.entries()) {
        offsets.push(totalLength(chunks));
        chunks.push(ascii(`${index + 1} 0 obj\n`), object, ascii("\nendobj\n"));
    }

    const xrefOffset = totalLength(chunks);
    chunks.push(ascii(`xref\n0 ${objects.length + 1}\n`));
    chunks.push(ascii("0000000000 65535 f \n"));

    for (const offset of offsets.slice(1)) {
        chunks.push(ascii(`${offset.toString().padStart(10, "0")} 00000 n \n`));
    }

    chunks.push(ascii(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`));

    return concat(chunks);
}

function streamObject(dictionary: string, data: Uint8Array): Uint8Array {
    return concat([ascii(`${dictionary}\nstream\n`), data, ascii("\nendstream")]);
}

function ascii(value: string): Uint8Array {
    return textEncoder.encode(value);
}

function concat(chunks: Uint8Array[]): Uint8Array {
    const result = new Uint8Array(totalLength(chunks));
    let offset = 0;

    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }

    return result;
}

function totalLength(chunks: Uint8Array[]): number {
    return chunks.reduce((sum, chunk) => sum + chunk.length, 0);
}

function ascii85Encode(data: Uint8Array): Uint8Array {
    let encoded = "";

    for (let index = 0; index < data.length; index += 4) {
        const remaining = Math.min(4, data.length - index);
        const block = new Uint8Array(4);
        block.set(data.slice(index, index + remaining));

        let value = ((block[0]! << 24) >>> 0) + (block[1]! << 16) + (block[2]! << 8) + block[3]!;
        const digits = Array.from<string>({ length: 5 });

        for (let digitIndex = 4; digitIndex >= 0; digitIndex--) {
            digits[digitIndex] = String.fromCharCode((value % 85) + 33);
            value = Math.floor(value / 85);
        }

        encoded += digits.slice(0, remaining + 1).join("");
    }

    return ascii(`${encoded}~>`);
}

function runLengthEncode(data: Uint8Array): Uint8Array {
    const chunks: number[] = [];

    for (let offset = 0; offset < data.length; offset += 128) {
        const chunk = data.slice(offset, offset + 128);
        chunks.push(chunk.length - 1, ...chunk);
    }

    chunks.push(128);

    return new Uint8Array(chunks);
}

function hasJpegMagic(data: Uint8Array): boolean {
    return data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
}
