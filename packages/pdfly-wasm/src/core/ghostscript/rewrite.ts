import { GhostscriptCompressionError, GhostscriptValidationError } from "../errors.js";
import { calculateSavings } from "../../utils/format.js";
import { normalizeBuffer } from "../../utils/validation.js";
import type { CompressResult, GhostscriptCompressOptions } from "../../types/index.js";
import type { GhostscriptErrorOptions } from "../errors.js";
import { buildGhostscriptArgs, validateGhostscriptOptions } from "./options.js";
import { cleanupGhostscriptMemfsFile, nextGhostscriptMemfsPath, withGhostscriptExecution } from "./runtime.js";

export async function rewritePdfWithGhostscript(input: Uint8Array | ArrayBuffer, options?: GhostscriptCompressOptions): Promise<Uint8Array> {
    const inputBuffer = normalizeBuffer(input);
    const normalizedOptions = validateGhostscriptOptions(options);
    const capture = { stdout: [] as string[], stderr: [] as string[] };

    try {
        return await withGhostscriptExecution(capture, async (module) => {
            const inputPath = nextGhostscriptMemfsPath("input");
            const outputPath = nextGhostscriptMemfsPath("output");

            try {
                module.FS.writeFile(inputPath, inputBuffer);

                const args = buildGhostscriptArgs(inputPath, outputPath, normalizedOptions);
                const exitCode = module.callMain(args);
                if (exitCode !== 0) {
                    const errorOptions: GhostscriptErrorOptions = {
                        code: "write_failed",
                        operation: "ghostscript-rewrite",
                    };
                    throw new GhostscriptCompressionError(buildGhostscriptFailureMessage(exitCode, capture.stderr), errorOptions);
                }

                return module.FS.readFile(outputPath).slice();
            } finally {
                cleanupGhostscriptMemfsFile(module.FS, inputPath);
                cleanupGhostscriptMemfsFile(module.FS, outputPath);
            }
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

export async function compressPdfWithGhostscript(
    input: Uint8Array | ArrayBuffer,
    options?: GhostscriptCompressOptions
): Promise<CompressResult> {
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

function buildGhostscriptFailureMessage(exitCode: number, stderr: string[]): string {
    if (stderr.length === 0) {
        return `Ghostscript exited with code ${exitCode}`;
    }

    const detail = stderr.slice(-5).join(" | ");
    return `Ghostscript exited with code ${exitCode}: ${detail}`;
}
