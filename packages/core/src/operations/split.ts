import { getQpdfBinding } from "../bindings/index.js";
import { QpdfSplitError } from "../errors/index.js";
import { toUint8Array } from "../utils/buffer.js";
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
        const inputBuffer = toUint8Array(input);
        const pages = await getQpdfBinding().splitPages(inputBuffer);

        return {
            pages,
            pageCount: pages.length,
        };
    } catch (error) {
        if (error instanceof TypeError) {
            throw new QpdfSplitError(error.message, { cause: error });
        }
        if (error instanceof QpdfSplitError) {
            throw error;
        }
        throw new QpdfSplitError("Failed to split PDF", { cause: error });
    }
}
