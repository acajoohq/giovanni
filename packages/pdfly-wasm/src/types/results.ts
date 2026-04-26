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
 * A single image extracted from a PDF.
 *
 * `bytes` is always populated. `blob` is populated for filters the browser can
 * decode directly (DCTDecode → JPEG, JPXDecode → JPEG-2000) and for raw-pixel
 * streams that were re-encoded as PNG by the canvas adapter. For unsupported
 * filter chains (CCITT, JBIG2, exotic color spaces, etc.) `blob` is null and
 * `unsupportedReason` explains why — `bytes` still holds the raw stream so
 * callers can offer a download or layer their own decoder on top.
 */
export interface ExtractedImage {
    /** Stable identity in the source PDF (`"obj/gen"`). */
    objectKey: string;
    /** XObject name as it appears in the page's resource dictionary (e.g. `Im0`). */
    xobjectKey: string;
    /** Zero-based index of the first page where this image is referenced. */
    pageIndex: number;
    /** Leaf filter name from the PDF (e.g. `DCTDecode`, `FlateDecode`, `none`). */
    filter: string;
    width: number;
    height: number;
    bitsPerComponent: number;
    /** Color space description from the image dictionary, in qpdf's string form. */
    colorSpace: string;
    /** Component count resolved by qpdf (1=gray, 3=RGB, 4=CMYK; 0 when unknown). */
    components: number;
    hasMask: boolean;
    hasSMask: boolean;
    isImageMask: boolean;
    /** Raw bytes from the qpdf side; format depends on `filter`. */
    bytes: Uint8Array;
    /** Browser-ready Blob, or null when the image could not be decoded. */
    blob: Blob | null;
    /** Mime type of `blob`, or null when `blob` is null. */
    mimeType: string | null;
    /** Set when `blob` is null. */
    unsupportedReason?: string;
}

/**
 * Result of a PDF image extraction
 */
export interface ExtractImagesResult {
    images: ExtractedImage[];
    imageCount: number;
}
