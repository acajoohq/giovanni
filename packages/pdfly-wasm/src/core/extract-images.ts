import { initQpdfModule } from "./module-loader.js";
import { QpdfImageExtractionError } from "./errors.js";
import { normalizeBuffer } from "../utils/validation.js";
import type { ExtractedImage, ExtractImagesResult } from "../types/index.js";
import type { WasmExtractedImage } from "../types/wasm-module.js";

/**
 * Extract every embedded raster image from a PDF.
 *
 * The C++ side parses the PDF and hands back the bytes of each image XObject
 * along with its metadata. The TypeScript side dispatches per filter so the
 * browser does the actual pixel work:
 *
 * - DCTDecode / JPXDecode → bytes are already a complete JPEG / JPEG-2000;
 *   wrap in a Blob with the matching mime type. Zero re-encode.
 * - FlateDecode / LZWDecode / RunLengthDecode / no filter → bytes are raw
 *   pixels; encode to PNG via canvas (DeviceGray and DeviceRGB only in v1).
 * - CCITTFaxDecode / JBIG2Decode / unsupported color spaces → blob is null,
 *   `unsupportedReason` explains why; raw bytes are still returned so the
 *   caller can offer a binary download or layer in a JS fallback.
 *
 * @example
 * const pdfBytes = await fetch("doc.pdf").then((r) => r.arrayBuffer());
 * const { images } = await extractImages(pdfBytes);
 * for (const image of images) {
 *     if (image.blob) {
 *         const url = URL.createObjectURL(image.blob);
 *     }
 * }
 */
export async function extractImages(input: Uint8Array | ArrayBuffer): Promise<ExtractImagesResult> {
    try {
        const module = await initQpdfModule();
        if (typeof module.extractImages !== "function") {
            throw new QpdfImageExtractionError("Failed to extract images: qpdf module is missing the extractImages export. Ensure qpdf.js and qpdf.wasm are up to date.");
        }
        const inputBuffer = normalizeBuffer(input);
        const rawImages: WasmExtractedImage[] = module.extractImages(inputBuffer);

        const images: ExtractedImage[] = [];
        for (const raw of rawImages) {
            images.push(await toExtractedImage(raw));
        }

        return { images, imageCount: images.length };
    } catch (error) {
        if (error instanceof QpdfImageExtractionError) {
            throw error;
        }
        throw new QpdfImageExtractionError("Failed to extract images from PDF", { cause: error });
    }
}

async function toExtractedImage(raw: WasmExtractedImage): Promise<ExtractedImage> {
    const base = {
        objectKey: raw.objectKey,
        xobjectKey: raw.xobjectKey,
        pageIndex: raw.pageIndex,
        filter: raw.filter,
        width: raw.width,
        height: raw.height,
        bitsPerComponent: raw.bitsPerComponent,
        colorSpace: raw.colorSpace,
        components: raw.components,
        hasMask: raw.hasMask,
        hasSMask: raw.hasSMask,
        isImageMask: raw.isImageMask,
        bytes: raw.bytes,
    };

    if (raw.strategy === "encoded") {
        const mimeType = raw.filter === "JPXDecode" ? "image/jp2" : "image/jpeg";
        return {
            ...base,
            blob: new Blob([raw.bytes as BlobPart], { type: mimeType }),
            mimeType,
        };
    }

    if (raw.strategy === "raw-pixels") {
        const encoded = await encodeRawPixelsAsPng(raw);
        if (encoded) {
            return { ...base, blob: encoded, mimeType: "image/png" };
        }
        return {
            ...base,
            blob: null,
            mimeType: null,
            unsupportedReason: rawPixelUnsupportedReason(raw),
        };
    }

    if (raw.strategy === "unsupported") {
        return {
            ...base,
            blob: null,
            mimeType: null,
            unsupportedReason: `Filter ${raw.filter} is not supported by browsers; raw bytes are available.`,
        };
    }

    return {
        ...base,
        blob: null,
        mimeType: null,
        unsupportedReason: "qpdf could not read this image stream.",
    };
}

function rawPixelUnsupportedReason(raw: WasmExtractedImage): string {
    if (typeof OffscreenCanvas === "undefined" && typeof document === "undefined") {
        return "Raw-pixel images need a browser canvas to be encoded as PNG.";
    }
    if (raw.bitsPerComponent !== 8) {
        return `Unsupported bits-per-component: ${raw.bitsPerComponent} (only 8 is implemented).`;
    }
    if (raw.components !== 1 && raw.components !== 3 && raw.components !== 4) {
        return `Unsupported color space: ${raw.colorSpace || "(none)"}.`;
    }
    return "Pixel data could not be encoded.";
}

async function encodeRawPixelsAsPng(raw: WasmExtractedImage): Promise<Blob | null> {
    if (raw.bitsPerComponent !== 8) return null;
    if (raw.width <= 0 || raw.height <= 0) return null;

    const components = raw.components;
    if (components !== 1 && components !== 3 && components !== 4) return null;

    const expected = raw.width * raw.height * components;
    if (raw.bytes.length < expected) return null;

    const rgba = expandToRgba(raw.bytes, raw.width, raw.height, components);
    if (!rgba) return null;

    const canvas = createCanvas(raw.width, raw.height);
    if (!canvas) return null;

    const context = canvas.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
    if (!context) return null;

    const imageData = createImageData(rgba, raw.width, raw.height);
    if (!imageData) return null;

    context.putImageData(imageData, 0, 0);

    if (typeof OffscreenCanvas !== "undefined" && canvas instanceof OffscreenCanvas) {
        return canvas.convertToBlob({ type: "image/png" });
    }

    return new Promise<Blob | null>((resolve) => {
        (canvas as HTMLCanvasElement).toBlob((blob) => resolve(blob), "image/png");
    });
}

function expandToRgba(pixels: Uint8Array, width: number, height: number, components: number): Uint8ClampedArray | null {
    const total = width * height;
    const rgba = new Uint8ClampedArray(total * 4);

    if (components === 1) {
        for (let i = 0; i < total; i++) {
            const value = pixels[i] ?? 0;
            const offset = i * 4;
            rgba[offset] = value;
            rgba[offset + 1] = value;
            rgba[offset + 2] = value;
            rgba[offset + 3] = 255;
        }
        return rgba;
    }

    if (components === 3) {
        // 3-channel pixels are written straight into the canvas as sRGB.
        // When the source space is ICCBased / CalRGB / Lab, the values are
        // really in that profile's space — the spec says to transform them
        // through the embedded profile before display. We skip that step;
        // most photo PDFs use a near-sRGB profile so the visual difference
        // is small, but it is wrong for color-critical work.
        for (let i = 0; i < total; i++) {
            const source = i * 3;
            const offset = i * 4;
            rgba[offset] = pixels[source] ?? 0;
            rgba[offset + 1] = pixels[source + 1] ?? 0;
            rgba[offset + 2] = pixels[source + 2] ?? 0;
            rgba[offset + 3] = 255;
        }
        return rgba;
    }

    if (components === 4) {
        // Naive CMYK→RGB without color management. The PDF spec says CMYK
        // values should be transformed through the embedded ICC profile (or
        // a device default) before display; we skip that and use the simple
        // (1−c)(1−k) formula. Good enough for thumbnails — saturated colors
        // and out-of-gamut tones will look noticeably off.
        for (let i = 0; i < total; i++) {
            const source = i * 4;
            const c = (pixels[source] ?? 0) / 255;
            const m = (pixels[source + 1] ?? 0) / 255;
            const y = (pixels[source + 2] ?? 0) / 255;
            const k = (pixels[source + 3] ?? 0) / 255;
            const offset = i * 4;
            rgba[offset] = Math.round((1 - c) * (1 - k) * 255);
            rgba[offset + 1] = Math.round((1 - m) * (1 - k) * 255);
            rgba[offset + 2] = Math.round((1 - y) * (1 - k) * 255);
            rgba[offset + 3] = 255;
        }
        return rgba;
    }

    return null;
}

function createCanvas(width: number, height: number): OffscreenCanvas | HTMLCanvasElement | null {
    if (typeof OffscreenCanvas !== "undefined") {
        return new OffscreenCanvas(width, height);
    }
    if (typeof document !== "undefined") {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }
    return null;
}

function createImageData(rgba: Uint8ClampedArray, width: number, height: number): ImageData | null {
    if (typeof ImageData !== "undefined") {
        // ImageData's constructor requires Uint8ClampedArray<ArrayBuffer> in
        // modern DOM lib types; rgba is allocated locally so its backing
        // buffer is always an ArrayBuffer, not a SharedArrayBuffer.
        return new ImageData(rgba as Uint8ClampedArray<ArrayBuffer>, width, height);
    }
    return null;
}
