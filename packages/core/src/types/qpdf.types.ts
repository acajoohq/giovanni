import type { PdfData } from "./pdf.types.js";

/**
 * Compression decode level - controls how aggressively to decode streams
 */
export type DecodeLevel = "none" | "generalized" | "specialized" | "all";

/**
 * Object stream mode - controls how objects are stored in the PDF
 */
export type ObjectStreamMode = "preserve" | "disable" | "generate";

/**
 * Preset for qpdf's lossless writer pipeline.
 */
export type QpdfOptimizePreset = "default" | "web" | "archive";

/**
 * Shared qpdf writer options.
 */
export interface WriteOptions {
    /**
     * Whether to produce a linearized PDF for byte-range web delivery.
     * @default false
     */
    linearize?: boolean;

    /**
     * Compression level (1-9)
     * 1 = fastest, least compression
     * 9 = slowest, best compression
     * @default 6
     */
    compressionLevel?: number;

    /**
     * Decode level - controls how aggressively to decode and recompress streams
     * - 'none': Don't decode anything
     * - 'generalized': Decode generalized filters (predictors, etc.)
     * - 'specialized': Decode specialized filters (JPEG, etc.)
     * - 'all': Decode everything possible
     * @default 'generalized'
     */
    decodeLevel?: DecodeLevel;

    /**
     * Whether to recompress streams that are already compressed with flate
     * @default true
     */
    recompressFlate?: boolean;

    /**
     * Object stream mode - controls how objects are stored
     * - 'preserve': Keep existing object streams
     * - 'disable': Disable object streams
     * - 'generate': Generate object streams for better compression
     * @default 'generate' prefer `'preserve'` when output must mirror input structure
     */
    objectStreams?: ObjectStreamMode;

    /**
     * Whether to compress pages (combine multiple content streams)
     * @default false
     */
    compressPages?: boolean;

    /**
     * Whether to remove unreferenced resources
     * @default false
     */
    removeUnreferencedResources?: boolean;
}

/**
 * Options for PDF optimization.
 */
export interface OptimizeOptions extends WriteOptions {
    /**
     * Named lossless optimization preset.
     * @default "default"
     */
    preset?: QpdfOptimizePreset;
}

/**
 * Options for merging PDFs.
 */
export interface MergeOptions extends WriteOptions {}

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
