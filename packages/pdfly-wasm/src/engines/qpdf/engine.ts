import type { CompressionEngineAdapter } from "../../compression/compression-engine.interface.js";
import type { OptimizeOptions } from "../../types/index.js";
import { initQpdfModule } from "./module-loader.js";
import { compressPdfWithQpdf } from "./optimize.js";

export const qpdfCompressionEngine: CompressionEngineAdapter<({ engine?: "qpdf" } & OptimizeOptions) | OptimizeOptions> = {
    engine: "qpdf",
    async init(): Promise<void> {
        await initQpdfModule();
    },
    async compress(input, options = {}) {
        return compressPdfWithQpdf(input, options);
    },
};
