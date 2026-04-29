import { initQpdfModule } from "./module-loader.js";
import { QpdfConversionError } from "./errors.js";
import { normalizeBuffer } from "../utils/validation.js";
import type { PdfToJpgOptions, PdfPageJpg, PdfToJpgResult } from "../types/index.js";
import type { WasmExtractedImage } from "../types/wasm-module.js";

/**
 * Convert a PDF to JPG images by extracting and re-encoding embedded raster images.
 *
 * Each page in the PDF that contains at least one raster image produces a
 * {@link PdfPageJpg} entry. JPEG-encoded images are passed through without
 * re-encoding; raw-pixel images are encoded via the browser Canvas API.
 * Pages with no raster images (e.g. pure-text pages) produce no entry.
 *
 * @param input - PDF file as Uint8Array or ArrayBuffer
 * @param options - Conversion options (quality, allImagesPerPage)
 * @returns Conversion result with JPG blobs per page
 *
 * @example
 * ```typescript
 * const pdfBytes = await fetch('document.pdf').then(r => r.arrayBuffer());
 * const result = await pdfToJpg(pdfBytes, { quality: 0.9 });
 *
 * for (const page of result.pages) {
 *     const url = URL.createObjectURL(page.blob);
 *     console.log(`Page ${page.pageIndex}: ${page.width}x${page.height} - ${url}`);
 * }
 * ```
 */
export async function pdfToJpg(input: Uint8Array | ArrayBuffer, options?: PdfToJpgOptions): Promise<PdfToJpgResult> {
    const quality = options?.quality ?? 0.92;
    if (quality <= 0 || quality > 1) {
        throw new QpdfConversionError("quality must be greater than 0 and at most 1");
    }

    try {
        const module = await initQpdfModule();
        if (typeof module.extractImages !== "function") {
            throw new QpdfConversionError(
                "PDF to JPG conversion requires the extractImages export. Ensure qpdf.js and qpdf.wasm are up to date.",
            );
        }

        const inputBuffer = normalizeBuffer(input);
        const rawImages: WasmExtractedImage[] = module.extractImages(inputBuffer);

        // group images by page index
        const byPage = new Map<number, WasmExtractedImage[]>();
        for (const img of rawImages) {
            const list = byPage.get(img.pageIndex) ?? [];
            list.push(img);
            byPage.set(img.pageIndex, list);
        }

        const pageIndices = Array.from(byPage.keys()).sort((a, b) => a - b);
        const pages: PdfPageJpg[] = [];

        for (const pageIndex of pageIndices) {
            const images = byPage.get(pageIndex)!;

            if (options?.allImagesPerPage) {
                // return a JPG for every convertible image on the page
                for (const img of images) {
                    const converted = await toJpegBlob(img, quality);
                    if (converted) {
                        pages.push({ pageIndex, ...converted });
                    }
                }
            } else {
                // return only the largest (by pixel area) image per page
                images.sort((a, b) => b.width * b.height - a.width * a.height);
                for (const img of images) {
                    const converted = await toJpegBlob(img, quality);
                    if (converted) {
                        pages.push({ pageIndex, ...converted });
                        break;
                    }
                }
            }
        }

        return { pages, convertedPageCount: pages.length };
    } catch (error) {
        if (error instanceof QpdfConversionError) {
            throw error;
        }
        throw new QpdfConversionError("Failed to convert PDF to JPG", { cause: error });
    }
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

interface JpegResult {
    blob: Blob;
    width: number;
    height: number;
}

/** Convert a single extracted image to a JPEG Blob, or null when unsupported. */
async function toJpegBlob(raw: WasmExtractedImage, quality: number): Promise<JpegResult | null> {
    // JPEG images: pass bytes through directly without re-encoding
    if (raw.strategy === "encoded" && raw.filter === "DCTDecode") {
        return {
            blob: new Blob([raw.bytes], { type: "image/jpeg" }),
            width: raw.width,
            height: raw.height,
        };
    }

    // Raw-pixel images: encode via canvas as JPEG
    if (raw.strategy === "raw-pixels") {
        const blob = await encodeRawPixelsAsJpeg(raw, quality);
        if (blob) {
            return { blob, width: raw.width, height: raw.height };
        }
    }

    // JPX/JP2 and other encoded streams: decode with browser and re-encode
    if (raw.strategy === "encoded" && raw.filter === "JPXDecode") {
        const blob = await reencodeImageBlobAsJpeg(new Blob([raw.bytes], { type: "image/jp2" }), raw.width, raw.height, quality);
        if (blob) {
            return { blob, width: raw.width, height: raw.height };
        }
    }

    return null;
}

/** Encode raw pixel data (gray / rgb / cmyk) as a JPEG Blob via the Canvas API. */
async function encodeRawPixelsAsJpeg(image: WasmExtractedImage, quality: number): Promise<Blob | null> {
    if (image.bitsPerComponent !== 8) return null;
    if (image.width <= 0 || image.height <= 0) return null;

    const rgba = expandToRgba(image);
    if (!rgba) return null;

    const canvas = createCanvas(image.width, image.height);
    if (!canvas) return null;

    const context = canvas.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
    if (!context) return null;

    const imageData = createImageData(rgba, image.width, image.height);
    if (!imageData) return null;

    context.putImageData(imageData, 0, 0);

    if (typeof OffscreenCanvas !== "undefined" && canvas instanceof OffscreenCanvas) {
        return canvas.convertToBlob({ type: "image/jpeg", quality });
    }

    return new Promise<Blob | null>((resolve) => {
        (canvas as HTMLCanvasElement).toBlob((blob) => resolve(blob), "image/jpeg", quality);
    });
}

/** Re-encode a browser-decodable image Blob as JPEG by drawing it onto a canvas. */
async function reencodeImageBlobAsJpeg(source: Blob, width: number, height: number, quality: number): Promise<Blob | null> {
    if (typeof OffscreenCanvas === "undefined" && typeof document === "undefined") return null;
    if (width <= 0 || height <= 0) return null;

    try {
        const bitmap = await createImageBitmap(source);
        const w = bitmap.width || width;
        const h = bitmap.height || height;
        const canvas = createCanvas(w, h);
        if (!canvas) return null;

        const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
        if (!ctx) return null;

        ctx.drawImage(bitmap, 0, 0);

        if (typeof OffscreenCanvas !== "undefined" && canvas instanceof OffscreenCanvas) {
            return canvas.convertToBlob({ type: "image/jpeg", quality });
        }

        return new Promise<Blob | null>((resolve) => {
            (canvas as HTMLCanvasElement).toBlob((blob) => resolve(blob), "image/jpeg", quality);
        });
    } catch {
        return null;
    }
}

function expandToRgba(image: WasmExtractedImage): Uint8ClampedArray | null {
    const { pixels, width, height, pixelColorModel } = { pixels: image.bytes, width: image.width, height: image.height, pixelColorModel: image.pixelColorModel };
    const total = width * height;
    const rgba = new Uint8ClampedArray(total * 4);

    switch (pixelColorModel) {
        case "gray":
            for (let i = 0; i < total; i++) {
                const v = pixels[i] ?? 0;
                const o = i * 4;
                rgba[o] = v;
                rgba[o + 1] = v;
                rgba[o + 2] = v;
                rgba[o + 3] = 255;
            }
            return rgba;

        case "rgb":
            for (let i = 0; i < total; i++) {
                const s = i * 3;
                const o = i * 4;
                rgba[o] = pixels[s] ?? 0;
                rgba[o + 1] = pixels[s + 1] ?? 0;
                rgba[o + 2] = pixels[s + 2] ?? 0;
                rgba[o + 3] = 255;
            }
            return rgba;

        case "cmyk":
            for (let i = 0; i < total; i++) {
                const s = i * 4;
                const c = (pixels[s] ?? 0) / 255;
                const m = (pixels[s + 1] ?? 0) / 255;
                const y = (pixels[s + 2] ?? 0) / 255;
                const k = (pixels[s + 3] ?? 0) / 255;
                const o = i * 4;
                rgba[o] = Math.round((1 - c) * (1 - k) * 255);
                rgba[o + 1] = Math.round((1 - m) * (1 - k) * 255);
                rgba[o + 2] = Math.round((1 - y) * (1 - k) * 255);
                rgba[o + 3] = 255;
            }
            return rgba;

        default:
            return null;
    }
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
    try {
        return new ImageData(rgba, width, height);
    } catch {
        return null;
    }
}
