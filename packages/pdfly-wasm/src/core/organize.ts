import { splitPages } from "./split.js";
import { mergePdfs } from "./merge.js";
import { QpdfOrganizeError } from "./errors.js";
import { normalizeBuffer } from "../utils/validation.js";
import type { OrganizeResult } from "../types/index.js";

/**
 * Reorganize the pages of a PDF into a new order.
 *
 * @param input - PDF file as Uint8Array or ArrayBuffer
 * @param pageOrder - Array of 0-based page indices describing the new order.
 *   May include duplicates (to copy pages) or fewer indices than the original
 *   (to delete pages). Each index must be a valid page number in the source PDF.
 * @returns OrganizeResult with the reorganized PDF data
 *
 * @example
 * // Reverse a 3-page PDF
 * const result = await reorganizePages(pdfBytes, [2, 1, 0]);
 *
 * @example
 * // Remove the second page of a 3-page PDF
 * const result = await reorganizePages(pdfBytes, [0, 2]);
 */
export async function reorganizePages(input: Uint8Array | ArrayBuffer, pageOrder: number[]): Promise<OrganizeResult> {
    if (pageOrder.length === 0) {
        throw new QpdfOrganizeError("pageOrder must contain at least one page index");
    }

    try {
        const inputBuffer = normalizeBuffer(input);
        const { pages, pageCount } = await splitPages(inputBuffer);

        for (const index of pageOrder) {
            if (!Number.isInteger(index) || index < 0 || index >= pageCount) {
                throw new QpdfOrganizeError(`Invalid page index ${index}: must be an integer between 0 and ${pageCount - 1}`);
            }
        }

        const reorderedPages = pageOrder.map((i) => pages[i] as Uint8Array);
        const { data } = await mergePdfs(reorderedPages);

        return {
            data,
            pageCount: pageOrder.length,
            originalPageCount: pageCount,
        };
    } catch (error) {
        if (error instanceof QpdfOrganizeError) {
            throw error;
        }
        throw new QpdfOrganizeError("Failed to reorganize PDF pages", { cause: error });
    }
}
