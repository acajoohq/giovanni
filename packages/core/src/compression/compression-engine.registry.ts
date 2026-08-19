import { QpdfValidationError } from "../errors/index.js";
import type { CombinedCompressOptions, CompressOptions, CompressionEngine, GhostscriptCompressOptions, OptimizeOptions } from "../types/index.js";
import type { CompressionEngineAdapter } from "./compression-engine.interface.js";
import { combinedCompressionEngine } from "../engines/combined/engine.js";
import { ghostscriptCompressionEngine } from "../engines/ghostscript/engine.js";
import { qpdfCompressionEngine } from "../engines/qpdf/engine.js";

const ENGINE_ADAPTERS = {
    qpdf: qpdfCompressionEngine,
    ghostscript: ghostscriptCompressionEngine,
    combined: combinedCompressionEngine,
} satisfies {
    qpdf: CompressionEngineAdapter<OptimizeOptions>;
    ghostscript: CompressionEngineAdapter<GhostscriptCompressOptions>;
    combined: CompressionEngineAdapter<CombinedCompressOptions>;
};

export function getCompressionEngineAdapter(engine: "qpdf"): CompressionEngineAdapter<OptimizeOptions>;
export function getCompressionEngineAdapter(engine: "ghostscript"): CompressionEngineAdapter<GhostscriptCompressOptions>;
export function getCompressionEngineAdapter(engine: "combined"): CompressionEngineAdapter<CombinedCompressOptions>;
export function getCompressionEngineAdapter(
    engine: CompressionEngine,
): CompressionEngineAdapter<OptimizeOptions> | CompressionEngineAdapter<GhostscriptCompressOptions> | CompressionEngineAdapter<CombinedCompressOptions>;
export function getCompressionEngineAdapter(engine: CompressionEngine) {
    return ENGINE_ADAPTERS[engine];
}

export function getCompressionEngine(options?: CompressOptions): CompressionEngine {
    const engine = options?.engine ?? "qpdf";

    if (engine === "qpdf" || engine === "ghostscript" || engine === "combined") {
        return engine;
    }

    throw new QpdfValidationError("engine must be one of: qpdf, ghostscript, combined", { code: "invalid_input", operation: "compress" });
}

export function listCompressionEngines(): CompressionEngine[] {
    return Object.keys(ENGINE_ADAPTERS) as CompressionEngine[];
}
