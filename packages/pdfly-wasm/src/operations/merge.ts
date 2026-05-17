import { initQpdfModule } from "../engines/qpdf/module-loader.js";
import { QpdfMergeError } from "../errors/index.js";
import { toUint8Array } from "../utils/buffer.js";
import type { MergeResult } from "../types/index.js";

/**
 * Merge multiple PDFs into a single PDF
 *
 * @param inputs - Array of PDF files as Uint8Array or ArrayBuffer
 * @returns MergeResult with the merged PDF data and source count
 *
 * @example
 * const [pdf1, pdf2] = await Promise.all([
 *   fetch('a.pdf').then(r => r.arrayBuffer()),
 *   fetch('b.pdf').then(r => r.arrayBuffer()),
 * ]);
 * const result = await mergePdfs([pdf1, pdf2]);
 * console.log(`Merged ${result.sourceCount} PDFs into a ${result.data.byteLength}-byte PDF`);
 */
export async function mergePdfs(inputs: Array<Uint8Array | ArrayBuffer>): Promise<MergeResult> {
    if (inputs.length === 0) {
        throw new QpdfMergeError("At least one PDF must be provided to merge");
    }

    try {
        const module = await initQpdfModule();
        if (typeof module.mergePdfs !== "function") {
            throw new QpdfMergeError("Failed to initialize PDF merger: qpdf module is missing the mergePdfs export. Ensure qpdf.js and qpdf.wasm are up to date and compatible.");
        }

        const normalizedInputs = inputs.map(toUint8Array);
        const data: Uint8Array = module.mergePdfs(normalizedInputs).slice();

        return {
            data,
            sourceCount: inputs.length,
        };
    } catch (error) {
        if (error instanceof TypeError) {
            throw new QpdfMergeError(error.message, { cause: error });
        }
        if (error instanceof QpdfMergeError) {
            throw error;
        }
        throw new QpdfMergeError("Failed to merge PDFs", { cause: error });
    }
}
