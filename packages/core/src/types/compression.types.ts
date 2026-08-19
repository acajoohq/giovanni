import type { PdfData } from "./pdf.types.js";
import type { GhostscriptCompressOptions, GhostscriptPdfSettings } from "./ghostscript.types.js";
import type { OptimizeOptions, QpdfOptimizePreset } from "./qpdf.types.js";

export type CompressionEngine = "qpdf" | "ghostscript" | "combined";

export type QpdfCompressOptions = { engine?: "qpdf" } & OptimizeOptions;
export type GhostscriptEngineCompressOptions = { engine: "ghostscript" } & GhostscriptCompressOptions;

/**
 * Options for the "combined" engine: runs Ghostscript's image
 * downsample/recompress pass first, then qpdf's structural optimizer
 * (object streams, unreferenced-resource removal, linearization) on the
 * result.
 */
export interface CombinedCompressOptions {
    /**
     * Ghostscript pass options (image recompression), applied first.
     * Defaults to the "default" pdfSettings preset, which does not downsample
     * images — pass a preset like "ebook" to actually shrink images.
     */
    ghostscript?: GhostscriptCompressOptions;

    /**
     * qpdf pass options (structural optimization), applied to the
     * Ghostscript pass's output.
     */
    qpdf?: OptimizeOptions;
}
export type CombinedEngineCompressOptions = { engine: "combined" } & CombinedCompressOptions;

export type CompressOptions = QpdfCompressOptions | GhostscriptEngineCompressOptions | CombinedEngineCompressOptions;

export interface CompressResult extends PdfData {
    engine: CompressionEngine;
    preset: QpdfOptimizePreset | GhostscriptPdfSettings;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    savedBytes: number;
    percentageSaved: number;
}
