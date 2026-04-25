import { initQpdfModule } from "./module-loader.js";
import { QpdfCompressionError } from "./errors.js";
import { normalizeBuffer, validateCompressionOptions } from "../utils/validation.js";
import { calculateSavings } from "../utils/format.js";
import type { CompressionOptions, CompressionResult } from "../types/index.js";

/**
 * Initialize the qpdf WASM module
 * This is called automatically by compressPdf, but can be called manually
 * to preload the module before compression
 */
export async function initQpdf(): Promise<void> {
    await initQpdfModule();
}

/**
 * Get the qpdf library version
 */
export async function getVersion(): Promise<string> {
    const module = await initQpdfModule();
    return module.getVersion();
}

/**
 * Compress a PDF file with the specified options
 *
 * @param input - PDF file as Uint8Array or ArrayBuffer
 * @param options - Compression options
 * @returns Compression result with compressed data and statistics
 *
 * @example
 * ```typescript
 * const pdfBytes = await fetch('document.pdf').then(r => r.arrayBuffer());
 * const result = await compressPdf(pdfBytes, {
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
export async function compressPdf(input: Uint8Array | ArrayBuffer, options?: CompressionOptions): Promise<CompressionResult> {
    try {
        // initialize module
        const module = await initQpdfModule();

        // normalize and validate input
        const inputBuffer = normalizeBuffer(input);
        const validatedOptions = validateCompressionOptions(options);

        // perform compression
        const compressedBuffer = module.compressPdf(inputBuffer, validatedOptions);

        // calculate statistics
        const originalSize = inputBuffer.byteLength;
        const compressedSize = compressedBuffer.byteLength;
        const { savedBytes, compressionRatio, percentageSaved } = calculateSavings(originalSize, compressedSize);

        return {
            data: compressedBuffer,
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
        throw new QpdfCompressionError("Failed to compress PDF", { cause: error });
    }
}
