/**
 * PDF input accepted by qpdf-backed APIs.
 */
export type PdfInput = Uint8Array | ArrayBuffer;

export type CompressionEngine = "qpdf" | "ghostscript";

/**
 * Caller-owned PDF bytes.
 */
export interface PdfData {
    /**
     * PDF data.
     */
    data: Uint8Array;
}
