/**
 * Normalized options passed to the native PDF write operation.
 * All fields are required — callers must resolve defaults before invoking the binding.
 */
export interface NativeWriteOptions {
    compressionLevel: number;
    decodeLevel: string;
    recompressFlate: boolean;
    objectStreams: string;
    compressPages: boolean;
    removeUnreferencedResources: boolean;
    linearize: boolean;
}

/**
 * Document metadata returned by the native binding.
 */
export interface NativeDocumentInfo {
    numPages: number;
    pdfVersion: string;
    isEncrypted: boolean;
    isLinearized: boolean;
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
}

export type NativePixelColorModel = "unknown" | "gray" | "rgb" | "cmyk";
export type NativeColorComponentCount = 0 | 1 | 3 | 4;

/**
 * Raw image data returned by the native binding's extractImages operation.
 */
export interface NativeExtractedImage {
    objectKey: string;
    xobjectKey: string;
    pageIndex: number;
    filter: string;
    width: number;
    height: number;
    bitsPerComponent: number;
    colorSpace: string;
    components: NativeColorComponentCount;
    pixelColorModel: NativePixelColorModel;
    hasMask: boolean;
    hasSMask: boolean;
    isImageMask: boolean;
    strategy: "encoded" | "raw-pixels" | "unsupported" | "error";
    bytes: Uint8Array;
}

/**
 * Abstraction over the native qpdf implementation.
 *
 * Implement this interface to provide a binding for a specific runtime
 * (WASM, JSI, native Node addon, …). Register your implementation via
 * {@link setQpdfBinding} from `@pdfly/wasm/bindings`.
 *
 * @example
 * ```typescript
 * import { setQpdfBinding } from "@pdfly/wasm/bindings";
 * import { myJsiQpdfBinding } from "./my-jsi-binding";
 *
 * setQpdfBinding(myJsiQpdfBinding);
 * ```
 */
export interface QpdfBinding {
    /**
     * Initialize the binding (e.g. load WASM, warm up the native bridge).
     * Operations will lazily call this if needed, but pre-calling eliminates
     * first-use latency.
     */
    init(): Promise<void>;

    /**
     * Return the qpdf library version string.
     */
    getVersion(): Promise<string>;

    /**
     * Write a PDF with the given normalized options.
     *
     * @param data - Input PDF bytes
     * @param options - Normalized write options (all fields required)
     * @param password - Optional password for encrypted input PDFs
     */
    writePdf(data: Uint8Array, options: NativeWriteOptions, password?: string): Promise<Uint8Array>;

    /**
     * Split a PDF into individual single-page PDFs.
     *
     * @param data - Input PDF bytes
     */
    splitPages(data: Uint8Array): Promise<Uint8Array[]>;

    /**
     * Merge multiple PDFs into a single PDF.
     *
     * @param inputs - Array of PDF byte arrays
     */
    mergePdfs(inputs: Uint8Array[]): Promise<Uint8Array>;

    /**
     * Return document metadata without a full write cycle.
     *
     * @param data - Input PDF bytes
     * @param password - Optional password for encrypted PDFs
     */
    getDocumentInfo(data: Uint8Array, password?: string): Promise<NativeDocumentInfo>;

    /**
     * Extract embedded images from a PDF.
     *
     * @param data - Input PDF bytes
     */
    extractImages(data: Uint8Array): Promise<NativeExtractedImage[]>;
}
