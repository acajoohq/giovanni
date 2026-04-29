/**
 * Compression decode level - controls how aggressively to decode streams
 */
export type DecodeLevel = "none" | "generalized" | "specialized" | "all";

/**
 * Object stream mode - controls how objects are stored in the PDF
 */
export type ObjectStreamMode = "preserve" | "disable" | "generate";

/**
 * Compression options for PDF optimization
 */
export interface CompressionOptions {
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
     * @default 'generate' â€” prefer `'preserve'` when output must mirror input structure
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
 * Options for PDF to JPG conversion
 */
export interface PdfToJpgOptions {
    /**
     * JPEG quality (0-1, where 1 is best quality)
     * @default 0.92
     */
    quality?: number;

    /**
     * When a page has multiple embedded images, return all of them.
     * By default only the largest image (by pixel area) per page is returned.
     * @default false
     */
    allImagesPerPage?: boolean;
}
