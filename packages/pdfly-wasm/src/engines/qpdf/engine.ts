import { QpdfCompressionError } from "../../errors/index.js";
import { calculateSavings } from "../../utils/format.js";
import { normalizeBuffer } from "../../utils/validation.js";
import type { CompressionEngineAdapter } from "../../compression/compressionEngine.interface.js";
import type { OptimizeOptions, OptimizeResult } from "../../types/index.js";
import { initQpdfModule } from "./module-loader.js";
import { getQpdfPreset, validateQpdfOptions } from "./options.js";

export const qpdfCompressionEngine: CompressionEngineAdapter<({ engine?: "qpdf" } & OptimizeOptions) | OptimizeOptions> = {
    engine: "qpdf",
    async init(): Promise<void> {
        await initQpdfModule();
    },
    async compress(input, options = {}): Promise<OptimizeResult & { engine: "qpdf" }> {
        try {
            const module = await initQpdfModule();
            const inputBuffer = normalizeBuffer(input);
            const validatedOptions = validateQpdfOptions(options);
            const optimizedBuffer = module.compressPdf(inputBuffer, validatedOptions).slice();

            const originalSize = inputBuffer.byteLength;
            const compressedSize = optimizedBuffer.byteLength;
            const { savedBytes, compressionRatio, percentageSaved } = calculateSavings(originalSize, compressedSize);

            return {
                engine: "qpdf",
                data: optimizedBuffer,
                preset: getQpdfPreset(options),
                originalSize,
                compressedSize,
                compressionRatio,
                savedBytes,
                percentageSaved,
            };
        } catch (error) {
            if (error instanceof QpdfCompressionError) {
                throw error;
            }
            throw new QpdfCompressionError("Failed to optimize PDF", { cause: error });
        }
    },
};
