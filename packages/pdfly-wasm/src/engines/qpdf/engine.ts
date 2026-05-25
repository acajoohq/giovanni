import type { CompressionEngineAdapter } from "../../compression/compression-engine.interface.js";
import type { OptimizeOptions } from "../../types/index.js";
import { getQpdfBinding } from "../../bindings/index.js";
import { compressPdfWithQpdf } from "./optimize.js";

export const qpdfCompressionEngine: CompressionEngineAdapter<OptimizeOptions> = {
    engine: "qpdf",
    async init(): Promise<void> {
        await getQpdfBinding().init();
    },
    async compress(input, options = {}) {
        return compressPdfWithQpdf(input, options);
    },
};
