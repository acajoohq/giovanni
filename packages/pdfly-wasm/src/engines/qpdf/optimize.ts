import { QpdfCompressionError, QpdfValidationError } from "../../errors/index.js";
import { toUint8Array } from "../../utils/buffer.js";
import { calculateSavings } from "../../utils/format.js";
import type { CompressResult, OptimizeOptions, OptimizeResult } from "../../types/index.js";
import type { OptimizeResult as QpdfOptimizeResult } from "../../types/qpdf.types.js";
import { initQpdfModule } from "./module-loader.js";
import { getQpdfPreset, validateQpdfOptions } from "./options.js";

export async function compressPdfWithQpdf(input: Uint8Array | ArrayBuffer, options: OptimizeOptions = {}): Promise<OptimizeResult & { engine: "qpdf" }> {
    try {
        const module = await initQpdfModule();
        const inputBuffer = toUint8Array(input);
        const validatedOptions = validateQpdfOptions(options);
        const optimizedBuffer = module.compressPdf(inputBuffer, validatedOptions).slice();

        const originalSize = inputBuffer.byteLength;
        const compressedSize = optimizedBuffer.byteLength;
        const { savedBytes, compressionRatio, percentageSaved } = calculateSavings(originalSize, compressedSize);

        return {
            engine: "qpdf",
            data: optimizedBuffer,
            preset: getQpdfPreset(options),
            originalSize,
            compressedSize,
            compressionRatio,
            savedBytes,
            percentageSaved,
        };
    } catch (error) {
        if (error instanceof QpdfValidationError) {
            throw error;
        }
        if (error instanceof QpdfCompressionError) {
            throw error;
        }
        if (error instanceof TypeError) {
            throw new QpdfValidationError(error.message, { cause: error, code: "invalid_input" });
        }
        throw new QpdfCompressionError("Failed to optimize PDF", { cause: error });
    }
}

/**
 * Optimize a PDF file with qpdf's lossless writer pipeline.
 *
 * Defaults match {@link OptimizeOptions}: including `objectStreams: "generate"` when unset (smaller files; use `"preserve"` to stay closer to the input structure).
 *
 * @param input - PDF file as Uint8Array or ArrayBuffer
 * @param options - Optimization options
 * @returns Optimization result with output data and statistics
 *
 * @example
 * ```typescript
 * const pdfBytes = await fetch('document.pdf').then(r => r.arrayBuffer());
 * const result = await optimizePdf(pdfBytes, {
 *   compressionLevel: 9,
 *   decodeLevel: 'all',
 *   recompressFlate: true
 * });
 *
 * console.log(`Saved ${result.savedBytes} bytes (${result.compressionRatio * 100}% reduction)`);
 * // Download the compressed PDF
 * const blob = new Blob([result.data], { type: 'application/pdf' });
 * const url = URL.createObjectURL(blob);
 * ```
 */
export async function optimizePdf(input: Uint8Array | ArrayBuffer, options?: OptimizeOptions): Promise<OptimizeResult> {
    const result = await compressPdfWithQpdf(input, options);
    return toOptimizeResult(result);
}

export async function linearizePdf(input: Uint8Array | ArrayBuffer, options?: Omit<OptimizeOptions, "linearize">): Promise<OptimizeResult> {
    return optimizePdf(input, { ...options, linearize: true });
}

function toOptimizeResult(result: CompressResult): QpdfOptimizeResult {
    return {
        data: result.data,
        preset: result.preset as OptimizeResult["preset"],
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        compressionRatio: result.compressionRatio,
        savedBytes: result.savedBytes,
        percentageSaved: result.percentageSaved,
    };
}
