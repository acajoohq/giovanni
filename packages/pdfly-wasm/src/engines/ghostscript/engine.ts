import type { CompressionEngineAdapter } from "../../compression/compression-engine.interface.js";
import type { GhostscriptCompressOptions } from "../../types/index.js";
import { getGhostscriptBinding } from "../../bindings/index.js";
import { compressPdfWithGhostscript } from "./compress.js";

export const ghostscriptCompressionEngine: CompressionEngineAdapter<GhostscriptCompressOptions> = {
    engine: "ghostscript",
    async init(): Promise<void> {
        await getGhostscriptBinding().init();
    },
    async compress(input, options) {
        return compressPdfWithGhostscript(input, options);
    },
};
