/**
 * Result of a PDF compression operation
 */
export interface CompressionResult {
    /**
     * Compressed PDF data
     */
    data: Uint8Array;

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
export interface QPDFInfo {
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
 * Result of a PDF split operation
 */
export interface SplitResult {
    /**
     * Array of PDF pages as individual Uint8Arrays
     */
    pages: Uint8Array[];

    /**
     * Total number of pages
     */
    pageCount: number;
}

/**
 * Result of a PDF merge operation
 */
export interface MergeResult {
    /**
     * Merged PDF as a single Uint8Array
     */
    data: Uint8Array;

    /**
     * Number of PDFs that were merged
     */
    sourceCount: number;
}

/**
 * A single image extracted from a PDF. `bytes` is always populated; `blob` is
 * populated for JPEG/JPX (passthrough) and re-encoded raw-pixel streams.
 * For unsupported filters/color spaces, `blob` is null and `unsupportedReason` explains.
 */
export interface ExtractedImage {
    // stable identity in the source PDF ("obj/gen")
    objectKey: string;
    // XObject name in the page resource dict (e.g. Im0)
    xobjectKey: string;
    // zero-based index of the first page that references this image
    pageIndex: number;
    // leaf filter name (e.g. DCTDecode, FlateDecode, none)
    filter: string;
    width: number;
    height: number;
    bitsPerComponent: number;
    // color space description in qpdf string form
    colorSpace: string;
    // resolved component count (1=gray, 3=RGB, 4=CMYK; 0 when unknown)
    components: number;
    hasMask: boolean;
    hasSMask: boolean;
    isImageMask: boolean;
    // raw bytes from qpdf; format depends on filter
    bytes: Uint8Array;
    // browser-ready Blob, or null when the image could not be decoded
    blob: Blob | null;
    mimeType: string | null;
    // set when blob is null
    unsupportedReason?: string;
}

export interface ExtractImagesResult {
    images: ExtractedImage[];
    imageCount: number;
}
