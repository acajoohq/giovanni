import { GhostscriptCompressionError, GhostscriptValidationError, type GhostscriptErrorOptions } from "../../errors/index.js";
import { calculateSavings } from "../../utils/format.js";
import { normalizeBuffer } from "../../utils/validation.js";
import type { CompressResult, GhostscriptCompressOptions } from "../../types/index.js";
import { buildGhostscriptArgs, validateGhostscriptOptions } from "./options.js";
import { withGhostscriptExecution } from "./runtime.js";

export async function rewritePdfWithGhostscript(input: Uint8Array | ArrayBuffer, options?: GhostscriptCompressOptions): Promise<Uint8Array> {
    const inputBuffer = normalizeBuffer(input);
    const normalizedOptions = validateGhostscriptOptions(options);

    try {
        return await withGhostscriptExecution(async (module) => {
            const args = buildGhostscriptArgs(normalizedOptions);
            return module.rewritePdf(inputBuffer, args).slice();
        });
    } catch (error) {
        if (error instanceof GhostscriptValidationError || error instanceof GhostscriptCompressionError) {
            throw error;
        }

        const errorOptions: GhostscriptErrorOptions = {
            cause: error,
            code: "operation_failed",
            operation: "ghostscript-rewrite",
        };
        throw new GhostscriptCompressionError("Failed to rewrite PDF with Ghostscript", errorOptions);
    }
}

export async function compressPdfWithGhostscript(input: Uint8Array | ArrayBuffer, options?: GhostscriptCompressOptions): Promise<CompressResult> {
    const inputBuffer = normalizeBuffer(input);
    const normalizedOptions = validateGhostscriptOptions(options);
    const outputBuffer = await rewritePdfWithGhostscript(inputBuffer, options);
    const { savedBytes, compressionRatio, percentageSaved } = calculateSavings(inputBuffer.byteLength, outputBuffer.byteLength);

    return {
        engine: "ghostscript",
        data: outputBuffer,
        preset: normalizedOptions.pdfSettings,
        originalSize: inputBuffer.byteLength,
        compressedSize: outputBuffer.byteLength,
        compressionRatio,
        savedBytes,
        percentageSaved,
    };
}
