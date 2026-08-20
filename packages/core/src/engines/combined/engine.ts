import type { CompressionEngineAdapter } from "../../compression/compression-engine.interface.js";
import type { CombinedCompressOptions } from "../../types/index.js";
import { getGhostscriptBinding, getQpdfBinding } from "../../bindings/index.js";
import { compressPdfWithCombined } from "./compress.js";

export const combinedCompressionEngine: CompressionEngineAdapter<CombinedCompressOptions> = {
    engine: "combined",
    async init(): Promise<void> {
        await Promise.all([getQpdfBinding().init(), getGhostscriptBinding().init()]);
    },
    async compress(input, options) {
        return compressPdfWithCombined(input, options);
    },
};
