/**
 * Browser entry for pdf.js legacy. Configures the worker URL from the same
 * `pdfjs-dist` package version as the main module.
 */

import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import { configurePdfjsLegacyWorker } from "./pdfjsLegacy";
export type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist/types/src/display/api.js";

if (typeof window !== "undefined") {
    configurePdfjsLegacyWorker(GlobalWorkerOptions);
}

export { getDocument, GlobalWorkerOptions };
