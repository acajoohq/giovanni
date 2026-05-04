import { QpdfConversionError } from "./errors.js";
import { normalizeBuffer } from "../utils/validation.js";
import type { PdfPageJpg, PdfToJpgOptions, PdfToJpgResult } from "../types/index.js";
import type { RenderParameters } from "pdfjs-dist/types/src/display/api.js";
import { createCanvas, Canvas as NodeCanvas } from "canvas";

/**
 * Convert a PDF to JPG images by rendering each page via PDF.js.
 *
 * Unlike image-extraction approaches, this renders the full page content
 * including text, vector graphics, and raster images into a single JPEG,
 * producing one image per PDF page.
 *
 * @param input - PDF file as Uint8Array or ArrayBuffer
 * @param options - Conversion options
 * @returns Conversion result with one JPEG blob per page
 */
export async function pdfToJpg(input: Uint8Array | ArrayBuffer, options?: PdfToJpgOptions): Promise<PdfToJpgResult> {
    const quality = options?.quality ?? 0.92;
    const scale = options?.scale ?? 2.0;

    if (quality <= 0 || quality > 1) {
        throw new QpdfConversionError("quality must be greater than 0 and at most 1");
    }
    if (scale <= 0) {
        throw new QpdfConversionError("scale must be greater than 0");
    }

    const inputBuffer = normalizeBuffer(input);

    const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");

    if (!GlobalWorkerOptions.workerSrc) {
        try {
            GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).href;
        } catch {
            // Could not resolve worker URL (e.g. CommonJS context).
            // PDF.js will run in the main thread, which is slower but still functional.
        }
    }

    try {
        const loadingTask = getDocument({ data: inputBuffer });
        const pdf = await loadingTask.promise;

        const pages: PdfPageJpg[] = [];

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale });
            const width = Math.round(viewport.width);
            const height = Math.round(viewport.height);

            const canvas = createCanvas(width, height);
            if (!canvas) {
                page.cleanup();
                continue;
            }

            const context = canvas.getContext("2d");
            if (!context) {
                page.cleanup();
                continue;
            }

            const params: RenderParameters = {
                canvas: canvas as unknown as HTMLCanvasElement,
                canvasContext: context as unknown as CanvasRenderingContext2D,
                viewport,
            };
            await page.render(params).promise;

            page.cleanup();

            const blob = await canvasToJpegBlob(canvas, quality);
            if (blob) {
                pages.push({ pageIndex: pageNum - 1, blob, width, height });
            }
        }

        await pdf.destroy();

        return { pages, convertedPageCount: pages.length };
    } catch (error) {
        if (error instanceof QpdfConversionError) throw error;
        throw new QpdfConversionError("Failed to convert PDF to JPG", { cause: error });
    }
}

async function canvasToJpegBlob(canvas: OffscreenCanvas | HTMLCanvasElement | NodeCanvas, quality: number): Promise<Blob | null> {
    if (typeof OffscreenCanvas !== "undefined" && canvas instanceof OffscreenCanvas) {
        return canvas.convertToBlob({ type: "image/jpeg", quality });
    }
    // node-canvas (Canvas from the 'canvas' package) uses toBuffer instead of toBlob
    if (typeof (canvas as NodeCanvas).toBuffer === "function") {
        const buffer = (canvas as NodeCanvas).toBuffer("image/jpeg", { quality });
        return new Blob([new Uint8Array(buffer)], { type: "image/jpeg" });
    }
    return new Promise<Blob | null>((resolve) => {
        (canvas as HTMLCanvasElement).toBlob((blob) => resolve(blob), "image/jpeg", quality);
    });
}
