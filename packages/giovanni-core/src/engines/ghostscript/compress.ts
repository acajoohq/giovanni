import { GhostscriptCompressionError, GhostscriptValidationError, type GhostscriptErrorOptions } from "../../errors/index.js";
import { toUint8Array } from "../../utils/buffer.js";
import { calculateSavings } from "../../utils/format.js";
import type { CompressResult, GhostscriptCompressOptions } from "../../types/index.js";
import { validateGhostscriptOptions } from "./options.js";
import { rewritePdfWithNormalizedGhostscriptOptions } from "./rewrite.js";

export async function compressPdfWithGhostscript(input: Uint8Array | ArrayBuffer, options?: GhostscriptCompressOptions): Promise<CompressResult> {
    try {
        const inputBuffer = toUint8Array(input);
        const normalizedOptions = validateGhostscriptOptions(options);
        const outputBuffer = await rewritePdfWithNormalizedGhostscriptOptions(inputBuffer, normalizedOptions);
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
    } catch (error) {
        if (error instanceof TypeError) {
            throw new GhostscriptValidationError(error.message, { cause: error, code: "invalid_input" });
        }
        if (error instanceof GhostscriptValidationError || error instanceof GhostscriptCompressionError) {
            throw error;
        }

        const errorOptions: GhostscriptErrorOptions = {
            cause: error,
            code: "operation_failed",
            operation: "ghostscript-compress",
        };
        throw new GhostscriptCompressionError("Failed to compress PDF with Ghostscript", errorOptions);
    }
}
