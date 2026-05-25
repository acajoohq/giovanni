import { getCompressionEngine, getCompressionEngineAdapter, listCompressionEngines } from "../compression/compression-engine.registry.js";
import type { CompressionEngine, CompressOptions, CompressResult, GhostscriptCompressOptions, OptimizeOptions, QpdfCompressOptions } from "../types/index.js";

export { linearizePdf, optimizePdf } from "../engines/qpdf/optimize.js";

export function getAvailableCompressionEngines(): CompressionEngine[] {
    return listCompressionEngines();
}

export async function initCompressionEngine(engine: CompressionEngine): Promise<void> {
    await getCompressionEngineAdapter(engine).init();
}

export async function compressPdf(input: Uint8Array | ArrayBuffer, options?: CompressOptions): Promise<CompressResult> {
    if (options?.engine === "ghostscript") {
        return getCompressionEngineAdapter("ghostscript").compress(input, toGhostscriptEngineOptions(options));
    }

    getCompressionEngine(options);

    return getCompressionEngineAdapter("qpdf").compress(input, toQpdfEngineOptions(options));
}

function toQpdfEngineOptions(options?: QpdfCompressOptions): OptimizeOptions {
    const { engine: _engine, ...engineOptions } = options ?? {};
    return engineOptions;
}

function toGhostscriptEngineOptions(options: { engine: "ghostscript" } & GhostscriptCompressOptions): GhostscriptCompressOptions {
    const { engine: _engine, ...engineOptions } = options;
    return engineOptions;
}
