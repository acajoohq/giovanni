import type { PdfData } from "./pdf.types.js";
import type { GhostscriptCompressOptions, GhostscriptPdfSettings } from "./ghostscript.types.js";
import type { OptimizeOptions, QpdfOptimizePreset } from "./qpdf.types.js";

export type CompressionEngine = "qpdf" | "ghostscript";

export type QpdfCompressOptions = { engine?: "qpdf" } & OptimizeOptions;
export type GhostscriptEngineCompressOptions = { engine: "ghostscript" } & GhostscriptCompressOptions;
export type CompressOptions = QpdfCompressOptions | GhostscriptEngineCompressOptions;

export interface CompressResult extends PdfData {
    engine: CompressionEngine;
    preset: QpdfOptimizePreset | GhostscriptPdfSettings;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    savedBytes: number;
    percentageSaved: number;
}
