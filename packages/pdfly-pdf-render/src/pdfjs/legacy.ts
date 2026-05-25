/**
 * pdf.js legacy bundle — Mozilla's official polyfilled build for Safari, Tauri
 * WKWebView, and other runtimes that lack newer JavaScript APIs (for example
 * `Map.prototype.getOrInsertComputed`).
 *
 * Always use the legacy main module together with the matching legacy worker
 * from the same `pdfjs-dist` version.
 *
 * @see https://github.com/mozilla/pdf.js/wiki/Frequently-Asked-Questions#which-browsersenvironments-are-supported
 * @see https://v2.tauri.app/reference/webview-versions/
 */

export type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist/types/src/display/api.js";

const LEGACY_WORKER_SPECIFIER = "pdfjs-dist/legacy/build/pdf.worker.min.mjs";

type PdfjsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

type GlobalWorkerOptionsLike = Pick<typeof import("pdfjs-dist/legacy/build/pdf.mjs").GlobalWorkerOptions, "workerSrc">;

export function resolvePdfjsLegacyWorkerUrl(): string {
    // String literal is required so Vite can emit the worker as a hashed /assets file in client builds.
    return new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).href;
}

function resolvePdfjsLegacyWorkerUrlForNode(): string {
    return new URL(import.meta.resolve(LEGACY_WORKER_SPECIFIER)).href;
}

export function configurePdfjsLegacyWorker(globalWorkerOptions: GlobalWorkerOptionsLike): void {
    globalWorkerOptions.workerSrc = resolvePdfjsLegacyWorkerUrl();
}

export async function loadPdfjsLegacy(): Promise<PdfjsModule> {
    const mod = await import("pdfjs-dist/legacy/build/pdf.mjs");
    mod.GlobalWorkerOptions.workerSrc =
        typeof window === "undefined" ? resolvePdfjsLegacyWorkerUrlForNode() : resolvePdfjsLegacyWorkerUrl();
    return mod;
}
