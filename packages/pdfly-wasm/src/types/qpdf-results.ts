import type { PdfData } from "./common.js";
import type { QpdfOptimizePreset } from "./qpdf-options.js";

/**
 * Result of a PDF optimization operation.
 */
export interface OptimizeResult extends PdfData {
    /**
     * Optimization preset used for this output.
     */
    preset: QpdfOptimizePreset;

    /**
     * Original file size in bytes
     */
    originalSize: number;

    /**
     * Compressed file size in bytes
     */
    compressedSize: number;

    /**
     * Compression ratio (0-1, where 0.5 = 50% reduction)
     */
    compressionRatio: number;

    /**
     * Space saved in bytes
     */
    savedBytes: number;

    /**
     * Percentage of space saved, negative when output is larger
     */
    percentageSaved: number;
}

/**
 * PDF metadata information
 */
export interface QpdfDocumentInfo {
    /**
     * Number of pages in the PDF
     */
    numPages: number;

    /**
     * PDF version (e.g., "1.4", "1.7")
     */
    pdfVersion: string;

    /**
     * Whether the PDF is encrypted
     */
    isEncrypted: boolean;

    /**
     * Whether the PDF is linearized (optimized for web viewing)
     */
    isLinearized: boolean;

    /**
     * PDF title metadata (if available)
     */
    title?: string;

    /**
     * PDF author metadata (if available)
     */
    author?: string;

    /**
     * PDF subject metadata (if available)
     */
    subject?: string;

    /**
     * PDF creator metadata (if available)
     */
    creator?: string;
}

/**
 * Result of a qpdf check operation.
 */
export interface QpdfCheckResult {
    info: QpdfDocumentInfo;
    isValid: boolean;
    warnings: string[];
}
