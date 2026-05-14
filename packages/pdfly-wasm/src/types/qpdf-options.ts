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
 * Options for opening an encrypted PDF.
 */
export interface OpenDocumentOptions {
    /**
     * Password for encrypted PDFs.
     */
    password?: string;
}

/**
 * Options for splitting a PDF.
 */
export interface SplitOptions extends OpenDocumentOptions {}

/**
 * Options for merging PDFs.
 */
export interface MergeOptions extends WriteOptions {}

/**
 * Options for organizing pages.
 */
export interface OrganizeOptions extends OpenDocumentOptions {
    /**
     * Zero-based page indices for the output PDF.
     * Duplicates copy pages; omitted indices remove pages.
     */
    pages: number[];
}

/**
 * Options for inspecting a PDF.
 */
export interface InspectOptions extends OpenDocumentOptions {}

/**
 * Options for checking a PDF.
 */
export interface CheckOptions extends OpenDocumentOptions {}
