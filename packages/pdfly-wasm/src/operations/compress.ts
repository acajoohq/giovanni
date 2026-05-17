import { getCompressionEngine, getCompressionEngineAdapter, listCompressionEngines } from "../compression/compression-engine.registry.js";
import type { CompressionEngine, CompressOptions, CompressResult } from "../types/index.js";

export { linearizePdf, optimizePdf } from "../engines/qpdf/optimize.js";

export function getAvailableCompressionEngines(): CompressionEngine[] {
    return listCompressionEngines();
}

export async function initCompressionEngine(engine: CompressionEngine): Promise<void> {
    await getCompressionEngineAdapter(engine).init();
}

export async function compressPdf(input: Uint8Array | ArrayBuffer, options?: CompressOptions): Promise<CompressResult> {
    const engine = getCompressionEngine(options);
    return getCompressionEngineAdapter(engine).compress(input, options as never);
}
