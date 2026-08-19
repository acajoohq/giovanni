import { toUint8Array } from "../../utils/buffer.js";
import { calculateSavings } from "../../utils/format.js";
import type { CombinedCompressOptions, CompressResult } from "../../types/index.js";
import { compressPdfWithGhostscript } from "../ghostscript/compress.js";
import { compressPdfWithQpdf } from "../qpdf/optimize.js";

/**
 * Compress a PDF by running Ghostscript's image downsample/recompress pass
 * first, then qpdf's structural optimizer (object streams, unreferenced
 * resource removal, linearization) on the result.
 *
 * Errors from either pass propagate as-is (GhostscriptCompressionError /
 * GhostscriptValidationError from the first pass, QpdfCompressionError /
 * QpdfValidationError from the second).
 */
export async function compressPdfWithCombined(input: Uint8Array | ArrayBuffer, options: CombinedCompressOptions = {}): Promise<CompressResult> {
    const inputBuffer = toUint8Array(input);

    const ghostscriptResult = await compressPdfWithGhostscript(inputBuffer, options.ghostscript);
    const qpdfResult = await compressPdfWithQpdf(ghostscriptResult.data, options.qpdf);

    const { savedBytes, compressionRatio, percentageSaved } = calculateSavings(inputBuffer.byteLength, qpdfResult.data.byteLength);

    return {
        engine: "combined",
        data: qpdfResult.data,
        preset: ghostscriptResult.preset,
        originalSize: inputBuffer.byteLength,
        compressedSize: qpdfResult.data.byteLength,
        compressionRatio,
        savedBytes,
        percentageSaved,
    };
}
