import type { CompressionEngine, PdfData } from "./common.js";
import type { GhostscriptPdfSettings } from "./ghostscript-options.js";
import type { QpdfOptimizePreset } from "./qpdf-options.js";

export interface CompressResult extends PdfData {
    engine: CompressionEngine;
    preset: QpdfOptimizePreset | GhostscriptPdfSettings;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    savedBytes: number;
    percentageSaved: number;
}
