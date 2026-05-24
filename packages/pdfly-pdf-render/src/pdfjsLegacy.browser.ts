/**
 * Browser / Vite entry for pdf.js legacy. Configures the worker via Vite's `?url`
 * loader so the bundled worker URL resolves correctly in web and Tauri dev builds.
 */

import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
export type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist/types/src/display/api.js";
// oxlint-disable-next-line import/default -- Vite's ?url loader returns the worker URL as the default export.
import pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";

if (typeof window !== "undefined") {
    GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export { getDocument, GlobalWorkerOptions };
