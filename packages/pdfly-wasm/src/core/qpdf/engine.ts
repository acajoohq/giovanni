import { QpdfCompressionError } from "../errors.js";
import { calculateSavings } from "../../utils/format.js";
import { getOptimizePreset, normalizeBuffer, validateOptimizeOptions } from "../../utils/validation.js";
import type { CompressionEngineAdapter } from "../compression/adapter.js";
import type { OptimizeOptions, OptimizeResult } from "../../types/index.js";
import { initQpdfModule } from "./module-loader.js";

export const qpdfCompressionEngine: CompressionEngineAdapter<({ engine?: "qpdf" } & OptimizeOptions) | OptimizeOptions> = {
    engine: "qpdf",
    async init(): Promise<void> {
        await initQpdfModule();
    },
    async compress(input, options = {}): Promise<OptimizeResult & { engine: "qpdf" }> {
        try {
            const module = await initQpdfModule();
            const inputBuffer = normalizeBuffer(input);
            const validatedOptions = validateOptimizeOptions(options);
            const optimizedBuffer = module.compressPdf(inputBuffer, validatedOptions).slice();

            const originalSize = inputBuffer.byteLength;
            const compressedSize = optimizedBuffer.byteLength;
            const { savedBytes, compressionRatio, percentageSaved } = calculateSavings(originalSize, compressedSize);

            return {
                engine: "qpdf",
                data: optimizedBuffer,
                preset: getOptimizePreset(options),
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
