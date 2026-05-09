import { initQpdfModule } from "./module-loader.js";
import { QpdfCompressionError } from "./errors.js";
import { getOptimizePreset, normalizeBuffer, validateOptimizeOptions } from "../utils/validation.js";
import { calculateSavings } from "../utils/format.js";
import type { OptimizeOptions, OptimizeResult } from "../types/index.js";

/**
 * Initialize the qpdf WASM module
 * This is called automatically by qpdf operations, but can be called manually
 * to preload the module before compression
 */
export async function initQpdf(): Promise<void> {
    await initQpdfModule();
}

/**
 * Get the qpdf library version
 */
export async function getQpdfVersion(): Promise<string> {
    const module = await initQpdfModule();
    return module.getVersion();
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
    try {
        // initialize module
        const module = await initQpdfModule();

        // normalize and validate input
        const inputBuffer = normalizeBuffer(input);
        const validatedOptions = validateOptimizeOptions(options);

        // perform optimization
        const optimizedBuffer = module.compressPdf(inputBuffer, validatedOptions).slice();

        // calculate statistics
        const originalSize = inputBuffer.byteLength;
        const compressedSize = optimizedBuffer.byteLength;
        const { savedBytes, compressionRatio, percentageSaved } = calculateSavings(originalSize, compressedSize);

        return {
            data: optimizedBuffer,
            preset: getOptimizePreset(options),
            originalSize,
            compressedSize,
            compressionRatio,
            savedBytes,
            percentageSaved,
        };
    } catch (error) {
        if (error instanceof QpdfCompressionError) {
            throw error;
        }
        throw new QpdfCompressionError("Failed to optimize PDF", { cause: error });
    }
}

export async function linearizePdf(input: Uint8Array | ArrayBuffer, options?: Omit<OptimizeOptions, "linearize">): Promise<OptimizeResult> {
    return optimizePdf(input, { ...options, linearize: true });
}
