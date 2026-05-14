import type { CompressOptions, CompressionEngine } from "../../types/index.js";
import type { CompressionEngineAdapter } from "./adapter.js";
import { ghostscriptCompressionEngine } from "../ghostscript/engine.js";
import { qpdfCompressionEngine } from "../qpdf/engine.js";

const ENGINE_ADAPTERS: Record<CompressionEngine, CompressionEngineAdapter> = {
    qpdf: qpdfCompressionEngine,
    ghostscript: ghostscriptCompressionEngine,
};

export function getCompressionEngineAdapter(engine: CompressionEngine): CompressionEngineAdapter {
    return ENGINE_ADAPTERS[engine];
}

export function getCompressionEngine(options?: CompressOptions): CompressionEngine {
    return options?.engine ?? "qpdf";
}

export function listCompressionEngines(): CompressionEngine[] {
    return Object.keys(ENGINE_ADAPTERS) as CompressionEngine[];
}
