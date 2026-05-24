import { QpdfValidationError } from "../errors/index.js";
import type { CompressOptions, CompressionEngine, GhostscriptCompressOptions, OptimizeOptions } from "../types/index.js";
import type { CompressionEngineAdapter } from "./compression-engine.interface.js";
import { ghostscriptCompressionEngine } from "../engines/ghostscript/engine.js";
import { qpdfCompressionEngine } from "../engines/qpdf/engine.js";

const ENGINE_ADAPTERS = {
    qpdf: qpdfCompressionEngine,
    ghostscript: ghostscriptCompressionEngine,
} satisfies {
    qpdf: CompressionEngineAdapter<OptimizeOptions>;
    ghostscript: CompressionEngineAdapter<GhostscriptCompressOptions>;
};

export function getCompressionEngineAdapter(engine: "qpdf"): CompressionEngineAdapter<OptimizeOptions>;
export function getCompressionEngineAdapter(engine: "ghostscript"): CompressionEngineAdapter<GhostscriptCompressOptions>;
export function getCompressionEngineAdapter(engine: CompressionEngine): CompressionEngineAdapter<OptimizeOptions> | CompressionEngineAdapter<GhostscriptCompressOptions>;
export function getCompressionEngineAdapter(engine: CompressionEngine) {
    return ENGINE_ADAPTERS[engine];
}

export function getCompressionEngine(options?: CompressOptions): CompressionEngine {
    const engine = options?.engine ?? "qpdf";

    if (engine === "qpdf" || engine === "ghostscript") {
        return engine;
    }

    throw new QpdfValidationError("engine must be one of: qpdf, ghostscript", { code: "invalid_input", operation: "compress" });
}

export function listCompressionEngines(): CompressionEngine[] {
    return Object.keys(ENGINE_ADAPTERS) as CompressionEngine[];
}
