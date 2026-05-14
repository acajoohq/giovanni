import type { CompressionEngine, CompressOptions, CompressResult } from "../types/index.js";

export interface CompressionEngineAdapter<TOptions extends CompressOptions = CompressOptions> {
    readonly engine: CompressionEngine;
    init(): Promise<void>;
    compress(input: Uint8Array | ArrayBuffer, options?: TOptions): Promise<CompressResult>;
}
