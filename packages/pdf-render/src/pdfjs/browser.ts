/**
 * Browser entry for pdf.js. Picks the polyfill or standard build at runtime
 * based on capabilities (see needsPolyfillBuild).
 */

import { getPdfjs, type PdfjsModule } from "./load.js";

export type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist/types/src/display/api.js";
export { getPdfjs as loadBrowserPdfjs, type PdfjsModule };

export async function getDocument(...args: Parameters<PdfjsModule["getDocument"]>) {
    const pdfjs = await getPdfjs();
    return pdfjs.getDocument(...args);
}
