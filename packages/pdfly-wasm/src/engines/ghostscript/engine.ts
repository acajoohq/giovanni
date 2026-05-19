import type { CompressionEngineAdapter } from "../../compression/compression-engine.interface.js";
import type { GhostscriptCompressOptions } from "../../types/index.js";
import { initGhostscriptModule } from "./module-loader.js";
import { compressPdfWithGhostscript } from "./compress.js";

export const ghostscriptCompressionEngine: CompressionEngineAdapter<{ engine: "ghostscript" } & GhostscriptCompressOptions> = {
    engine: "ghostscript",
    async init(): Promise<void> {
        await initGhostscriptModule();
    },
    async compress(input, options) {
        return compressPdfWithGhostscript(input, options);
    },
};
