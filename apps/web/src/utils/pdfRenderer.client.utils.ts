import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
// oxlint-disable-next-line import/default -- Vite's ?url loader returns the worker URL as the default export.
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { copyPdfBytes } from "./pdfBytes.utils";

if (typeof window !== "undefined") {
    GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export type { PDFDocumentProxy };

interface CalculatePdfScaleOptions {
    baseViewport: { width: number; height: number };
    viewerSize?: { width: number; height: number } | null;
    pdfDocument?: PDFDocumentProxy | null;
}

const VIEWPORT_WIDTH_SCALE = 0.92;
const VIEWPORT_HEIGHT_SCALE = 0.88;
const NAVIGATION_HEIGHT = 52;
const MIN_CANVAS_HEIGHT = 200;

export function calculatePdfScale({ baseViewport, viewerSize, pdfDocument }: CalculatePdfScaleOptions): number {
    const fallbackWidth = typeof window !== "undefined" ? window.innerWidth * VIEWPORT_WIDTH_SCALE : baseViewport.width;
    const fallbackHeight = typeof window !== "undefined" ? window.innerHeight * VIEWPORT_HEIGHT_SCALE : baseViewport.height;

    const availableWidth = viewerSize?.width && viewerSize.width > 0 ? viewerSize.width * VIEWPORT_WIDTH_SCALE : fallbackWidth;
    const rawAvailableHeight = viewerSize?.height && viewerSize.height > 0 ? viewerSize.height * VIEWPORT_HEIGHT_SCALE : fallbackHeight;
    const navigationAllowance = pdfDocument?.numPages && pdfDocument.numPages > 1 ? NAVIGATION_HEIGHT : 0;
    const availableHeight = Math.max(rawAvailableHeight - navigationAllowance, MIN_CANVAS_HEIGHT);

    const widthScale = availableWidth / baseViewport.width;
    const heightScale = availableHeight / baseViewport.height;
    const computedScale = Math.min(widthScale, heightScale);

    return Number.isFinite(computedScale) && computedScale > 0 ? computedScale : 1;
}

interface RenderPdfPageToCanvasOptions {
    pdfPage: PDFPageProxy;
    canvas: HTMLCanvasElement;
    scale: number;
    shouldCommit?: () => boolean;
}

export async function renderPdfPageToCanvas({ pdfPage, canvas, scale, shouldCommit }: RenderPdfPageToCanvasOptions): Promise<void> {
    const viewport = pdfPage.getViewport({ scale });
    const outputScale = window.devicePixelRatio ?? 1;
    const context = canvas.getContext("2d");

    if (!context) throw new Error("failed to get canvas context");

    const offscreenCanvas = document.createElement("canvas");
    const offscreenContext = offscreenCanvas.getContext("2d");

    if (!offscreenContext) throw new Error("failed to get offscreen canvas context");

    offscreenCanvas.width = viewport.width * outputScale;
    offscreenCanvas.height = viewport.height * outputScale;
    offscreenContext.setTransform(1, 0, 0, 1, 0, 0);

    const renderContext = {
        canvasContext: offscreenContext,
        viewport,
        canvas: offscreenCanvas,
        transform: outputScale !== 1 ? ([outputScale, 0, 0, outputScale, 0, 0] as [number, number, number, number, number, number]) : undefined,
    };

    const renderTask = pdfPage.render(renderContext);
    await renderTask.promise;

    if (shouldCommit && !shouldCommit()) {
        return;
    }

    canvas.width = offscreenCanvas.width;
    canvas.height = offscreenCanvas.height;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(offscreenCanvas, 0, 0);
}

export async function loadPdfDocument(source: Uint8Array | ArrayBuffer): Promise<PDFDocumentProxy> {
    // pdf.js transfers typed-array data to its worker. Give it an owned copy so
    // preview rendering cannot detach bytes later used for download or ZIP.
    return getDocument({ data: copyPdfBytes(source) }).promise;
}
