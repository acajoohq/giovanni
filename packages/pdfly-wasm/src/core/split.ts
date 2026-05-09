import { initQpdfModule } from "./module-loader.js";
import { QpdfSplitError } from "./errors.js";
import { normalizeBuffer } from "../utils/validation.js";
import type { SplitResult } from "../types/index.js";

/**
 * Split a PDF into individual single-page PDFs
 *
 * @param input - PDF file as Uint8Array or ArrayBuffer
 * @returns SplitResult with an array of Uint8Arrays, one per page
 *
 * @example
 * const pdfBytes = await fetch('document.pdf').then(r => r.arrayBuffer());
 * const result = await splitPdf(pdfBytes);
 * console.log(`Split into ${result.pageCount} pages`);
 * result.pages.forEach((page, i) => {
 *   const blob = new Blob([page], { type: 'application/pdf' });
 *   // save or process each page
 * });
 */
export async function splitPdf(input: Uint8Array | ArrayBuffer): Promise<SplitResult> {
    try {
        const module = await initQpdfModule();
        if (typeof module.splitPages !== "function") {
            throw new QpdfSplitError(
                "Failed to initialize PDF splitter: qpdf module is missing the splitPages export. Ensure qpdf.js and qpdf.wasm are up to date and compatible.",
            );
        }
        const inputBuffer = normalizeBuffer(input);
        const rawPages: Uint8Array[] = module.splitPages(inputBuffer);
        // Copy each page out of WASM memory immediately. The Uint8Arrays returned by
        // the WASM module are views into the shared WASM heap. Any subsequent WASM
        // call (e.g. mergePdfs) may reallocate that heap, invalidating the views.
        const pages = rawPages.map((page) => page.slice());

        return {
            pages,
            pageCount: pages.length,
        };
    } catch (error) {
        if (error instanceof QpdfSplitError) {
            throw error;
        }
        throw new QpdfSplitError("Failed to split PDF", { cause: error });
    }
}
