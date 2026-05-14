import type { PdfData } from "./common.js";

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
export interface MergeResult extends PdfData {
    /**
     * Number of PDFs that were merged
     */
    sourceCount: number;
}

export type PixelColorModel = "unknown" | "gray" | "rgb" | "cmyk";
export type ColorComponentCount = 0 | 1 | 3 | 4;

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
    // resolved pdf color component count kept for metadata compatibility
    components: ColorComponentCount;
    // raw pixel interpretation supported by the browser encoder
    pixelColorModel: PixelColorModel;
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

/**
 * Result of a PDF page reorganization operation
 */
export interface OrganizeResult extends PdfData {
    /**
     * Number of pages in the output PDF
     */
    pageCount: number;

    /**
     * Number of pages in the original PDF
     */
    originalPageCount: number;
}
