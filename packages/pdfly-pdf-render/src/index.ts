import type { RenderParameters } from "pdfjs-dist/types/src/display/api.js";
import type { Canvas as NodeCanvas } from "canvas";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist/types/src/display/api.js";

export class PdfRenderError extends Error {
    declare readonly cause: unknown;

    constructor(message: string, options?: { cause?: unknown }) {
        super(message);
        this.name = "PdfRenderError";
        this.cause = options?.cause;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/**
 * A single JPG-converted page from a PDF
 */
export interface PdfPageJpg {
    /**
     * Zero-based page index in the source PDF
     */
    pageIndex: number;
    /**
     * JPG image as a browser Blob (image/jpeg)
     */
    blob: Blob;
    /**
     * Pixel width of the image
     */
    width: number;
    /**
     * Pixel height of the image
     */
    height: number;
}

/**
 * Options for rendering PDF pages to JPG.
 */
export interface RenderPdfPagesToJpgOptions {
    /**
     * JPEG quality (0-1], where 1 is best quality)
     * @default 0.92
     */
    quality?: number;
    /**
     * Rendering scale multiplier for PDF page rasterisation.
     * @default 2.0
     */
    scale?: number;
}

/**
 * Result of a PDF to JPG conversion operation
 */
export interface RenderPdfPagesToJpgResult {
    /**
     * Array of converted pages, ordered by pageIndex
     */
    pages: PdfPageJpg[];
    /**
     * Number of pages that produced at least one JPG image
     */
    convertedPageCount: number;
}

type PdfjsModule = typeof import("pdfjs-dist");

const pdfjsPromise: Promise<PdfjsModule | null> = import("pdfjs-dist")
    .then((mod) => {
        if (!mod.GlobalWorkerOptions.workerSrc) {
            try {
                mod.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).href;
            } catch {
                // worker URL resolution failed; PDF.js may run on the main thread
            }
        }
        return mod;
    })
    .catch(() => null);

const isBrowser = typeof window !== "undefined" || typeof OffscreenCanvas !== "undefined" || typeof document !== "undefined";
const nodeCanvasPromise: Promise<((w: number, h: number) => NodeCanvas) | null> = isBrowser
    ? Promise.resolve(null)
    : import("canvas").then(({ createCanvas }) => createCanvas as (w: number, h: number) => NodeCanvas).catch(() => null);

function normalizeBuffer(input: Uint8Array | ArrayBuffer): Uint8Array {
    if (input instanceof Uint8Array) {
        return input;
    }
    if (input instanceof ArrayBuffer) {
        return new Uint8Array(input);
    }
    throw new PdfRenderError("Input must be a Uint8Array or ArrayBuffer");
}

/**
 * Convert a PDF to JPG images by rendering each page via PDF.js.
 */
export async function renderPdfPagesToJpg(input: Uint8Array | ArrayBuffer, options?: RenderPdfPagesToJpgOptions): Promise<RenderPdfPagesToJpgResult> {
    const quality = options?.quality ?? 0.92;
    const scale = options?.scale ?? 2.0;

    if (quality <= 0 || quality > 1) {
        throw new PdfRenderError("quality must be greater than 0 and at most 1");
    }
    if (scale <= 0) {
        throw new PdfRenderError("scale must be greater than 0");
    }

    const pdfjs = await pdfjsPromise;
    if (!pdfjs) {
        throw new PdfRenderError("pdfjs-dist is required. Install it as a dependency of @pdfly/pdf-render.");
    }

    const inputBuffer = normalizeBuffer(input);
    const nodeCreateCanvas = await nodeCanvasPromise;

    try {
        const loadingTask = pdfjs.getDocument({ data: inputBuffer });
        const pdf: PDFDocumentProxy = await loadingTask.promise;

        const pages: PdfPageJpg[] = [];

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page: PDFPageProxy = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale });
            const width = Math.round(viewport.width);
            const height = Math.round(viewport.height);

            const canvas = nodeCreateCanvas ? nodeCreateCanvas(width, height) : createBrowserCanvas(width, height);
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
                canvas: canvas as HTMLCanvasElement,
                canvasContext: context as CanvasRenderingContext2D,
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
        if (error instanceof PdfRenderError) {
            throw error;
        }
        throw new PdfRenderError("Failed to convert PDF to JPG", { cause: error });
    }
}

function createBrowserCanvas(width: number, height: number): OffscreenCanvas | HTMLCanvasElement | null {
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

async function canvasToJpegBlob(canvas: OffscreenCanvas | HTMLCanvasElement | NodeCanvas, quality: number): Promise<Blob | null> {
    if (typeof OffscreenCanvas !== "undefined" && canvas instanceof OffscreenCanvas) {
        return canvas.convertToBlob({ type: "image/jpeg", quality });
    }
    if (typeof (canvas as NodeCanvas).toBuffer === "function") {
        const buffer = (canvas as NodeCanvas).toBuffer("image/jpeg", { quality });
        return new Blob([new Uint8Array(buffer)], { type: "image/jpeg" });
    }
    return new Promise<Blob | null>((resolve) => {
        (canvas as HTMLCanvasElement).toBlob((blob) => resolve(blob), "image/jpeg", quality);
    });
}
