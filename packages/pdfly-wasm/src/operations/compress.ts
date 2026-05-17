import { getCompressionEngine, getCompressionEngineAdapter, listCompressionEngines } from "../compression/compression-engine.registry.js";
import { initGhostscriptModule } from "../engines/ghostscript/module-loader.js";
import { initQpdfModule } from "../engines/qpdf/module-loader.js";
import type { CompressionEngine, CompressOptions, CompressResult, OptimizeOptions, OptimizeResult } from "../types/index.js";
import type { OptimizeResult as QpdfOptimizeResult } from "../types/qpdf.types.js";

/**
 * Initialize the qpdf WASM module
 * This is called automatically by qpdf operations, but can be called manually
 * to preload the module before compression
 */
export async function initQpdf(): Promise<void> {
    await initQpdfModule();
}

export function getAvailableCompressionEngines(): CompressionEngine[] {
    return listCompressionEngines();
}

export async function initCompressionEngine(engine: CompressionEngine): Promise<void> {
    await getCompressionEngineAdapter(engine).init();
}

/**
 * Get the qpdf library version
 */
export async function getQpdfVersion(): Promise<string> {
    const module = await initQpdfModule();
    return module.getVersion();
}

export async function getGhostscriptVersion(): Promise<string> {
    const module = await initGhostscriptModule();
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
    const result = await getCompressionEngineAdapter("qpdf").compress(input, options);
    return toOptimizeResult(result);
}

export async function compressPdf(input: Uint8Array | ArrayBuffer, options?: CompressOptions): Promise<CompressResult> {
    const engine = getCompressionEngine(options);
    return getCompressionEngineAdapter(engine).compress(input, options as never);
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
