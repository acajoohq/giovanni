import type { CompressionEngine, CompressResult } from "../types/index.js";

export interface CompressionEngineAdapter<TOptions = unknown> {
    readonly engine: CompressionEngine;
    init(): Promise<void>;
    compress(input: Uint8Array | ArrayBuffer, options?: TOptions): Promise<CompressResult>;
}
