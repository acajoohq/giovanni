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

type PdfjsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

export function resolvePdfjsLegacyWorkerUrl(): string {
    return new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).href;
}

export function loadPdfjsLegacy(): Promise<PdfjsModule | null> {
    return import("pdfjs-dist/legacy/build/pdf.mjs")
        .then((mod) => {
            if (!mod.GlobalWorkerOptions.workerSrc) {
                try {
                    mod.GlobalWorkerOptions.workerSrc = resolvePdfjsLegacyWorkerUrl();
                } catch {
                    // Worker URL resolution failed; pdf.js may run on the main thread.
                }
            }

            return mod;
        })
        .catch(() => null);
}
