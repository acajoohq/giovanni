import { GhostscriptCompressionError, GhostscriptValidationError, type GhostscriptErrorOptions } from "../../errors/index.js";
import { getGhostscriptBinding } from "../../bindings/index.js";
import { toUint8Array } from "../../utils/buffer.js";
import type { GhostscriptCompressOptions } from "../../types/index.js";
import { buildGhostscriptArgs, type NormalizedGhostscriptOptions, validateGhostscriptOptions } from "./options.js";

export async function rewritePdfWithGhostscript(input: Uint8Array | ArrayBuffer, options?: GhostscriptCompressOptions): Promise<Uint8Array> {
    try {
        const inputBuffer = toUint8Array(input);
        const normalizedOptions = validateGhostscriptOptions(options);
        return await rewritePdfWithNormalizedGhostscriptOptions(inputBuffer, normalizedOptions);
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

export async function rewritePdfWithNormalizedGhostscriptOptions(inputBuffer: Uint8Array, options: NormalizedGhostscriptOptions): Promise<Uint8Array> {
    const args = buildGhostscriptArgs(options);
    return getGhostscriptBinding().rewritePdf(inputBuffer, args);
}
