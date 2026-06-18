/**
 * A single JPG-converted page from a PDF
 */
export interface PdfPageJpg {
    /**
     * Zero-based page index in the source PDF
     */
    pageIndex: number;
    /**
     * JPG image as a browser Blob (image/jpeg)
     */
    blob: Blob;
    /**
     * Pixel width of the image
     */
    width: number;
    /**
     * Pixel height of the image
     */
    height: number;
}

/**
 * Options for rendering PDF pages to JPG.
 */
export interface RenderPdfPagesToJpgOptions {
    /**
     * JPEG quality (0-1], where 1 is best quality)
     * @default 0.92
     */
    quality?: number;
    /**
     * Rendering scale multiplier for PDF page rasterisation.
     * @default 2.0
     */
    scale?: number;
}

/**
 * Result of a PDF to JPG conversion operation
 */
export interface RenderPdfPagesToJpgResult {
    /**
     * Array of converted pages, ordered by pageIndex
     */
    pages: PdfPageJpg[];
    /**
     * Number of pages that produced at least one JPG image
     */
    convertedPageCount: number;
}
