import { GhostscriptCompressionError, GhostscriptValidationError, type GhostscriptErrorOptions } from "../../errors/index.js";
import { calculateSavings } from "../../utils/format.js";
import { toUint8Array } from "../../utils/buffer.js";
import type { CompressResult, GhostscriptCompressOptions } from "../../types/index.js";
import { buildGhostscriptArgs, validateGhostscriptOptions } from "./options.js";
import { withGhostscriptExecution } from "./execution.js";

export async function rewritePdfWithGhostscript(input: Uint8Array | ArrayBuffer, options?: GhostscriptCompressOptions): Promise<Uint8Array> {
    try {
        const inputBuffer = toUint8Array(input);
        const normalizedOptions = validateGhostscriptOptions(options);
        return await withGhostscriptExecution(async (module) => {
            const args = buildGhostscriptArgs(normalizedOptions);
            return module.rewritePdf(inputBuffer, args).slice();
        });
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
            operation: "ghostscript-rewrite",
        };
        throw new GhostscriptCompressionError("Failed to rewrite PDF with Ghostscript", errorOptions);
    }
}

export async function compressPdfWithGhostscript(input: Uint8Array | ArrayBuffer, options?: GhostscriptCompressOptions): Promise<CompressResult> {
    const inputBuffer = toUint8Array(input);
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
