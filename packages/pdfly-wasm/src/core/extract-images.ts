import { initQpdfModule } from "./module-loader.js";
import { QpdfImageExtractionError } from "./errors.js";
import { encodeRawPixelsAsPng, rawPixelUnsupportedReason } from "./pixel-encoder.js";
import { normalizeBuffer } from "../utils/validation.js";
import type { ExtractedImage, ExtractImagesResult } from "../types/index.js";
import type { WasmExtractedImage } from "../types/wasm-module.js";

/**
 * Extract every embedded raster image from a PDF.
 *
 * qpdf parses the PDF; the browser decodes the pixels. JPEG/JPX bytes are
 * passed through unchanged; raw-pixel streams are re-encoded as PNG via
 * {@link encodeRawPixelsAsPng}; CCITT/JBIG2 and other unsupported filters
 * are returned with `blob: null` and an `unsupportedReason`.
 *
 * @example
 * const { images } = await extractImages(pdfBytes);
 * for (const image of images) {
 *     if (image.blob) URL.createObjectURL(image.blob);
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
    const unsupportedReason =
        raw.strategy === "unsupported" ? `Filter ${raw.filter} is not supported by browsers; raw bytes are available.` : "qpdf could not read this image stream.";

    return {
        ...base,
        blob: null,
        mimeType: null,
        unsupportedReason,
    };
}
