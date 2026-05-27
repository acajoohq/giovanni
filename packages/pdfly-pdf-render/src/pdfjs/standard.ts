/**
 * pdf.js standard bundle for runtimes with modern JavaScript APIs (Chromium,
 * Firefox, Node.js, WebView2, etc.).
 *
 * Always use the standard main module together with the matching worker from
 * the same `pdfjs-dist` version.
 */

import type { PdfjsModule } from "./pdfjs-module.types.js";

export type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist/types/src/display/api.js";

const STANDARD_WORKER_SPECIFIER = "pdfjs-dist/build/pdf.worker.min.mjs";

type GlobalWorkerOptionsLike = Pick<PdfjsModule["GlobalWorkerOptions"], "workerSrc">;

export function resolvePdfjsStandardWorkerUrl(): string {
    // String literal is required so Vite can emit the worker as a hashed /assets file in client builds.
    return new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).href;
}

function resolvePdfjsStandardWorkerUrlForNode(): string {
    return new URL(import.meta.resolve(STANDARD_WORKER_SPECIFIER)).href;
}

export function configurePdfjsStandardWorker(globalWorkerOptions: GlobalWorkerOptionsLike): void {
    globalWorkerOptions.workerSrc = resolvePdfjsStandardWorkerUrl();
}

export async function loadPdfjsStandard(): Promise<PdfjsModule> {
    const mod = (await import("pdfjs-dist/build/pdf.mjs")) as PdfjsModule;
    mod.GlobalWorkerOptions.workerSrc = typeof window === "undefined" ? resolvePdfjsStandardWorkerUrlForNode() : resolvePdfjsStandardWorkerUrl();
    return mod;
}
