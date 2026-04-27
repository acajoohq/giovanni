/**
 * Internal WASM module interface
 * This matches the C++ Embind bindings
 */

export interface WasmCompressionOptions {
    compressionLevel: number;
    decodeLevel: string;
    recompressFlate: boolean;
    objectStreams: string;
    compressPages: boolean;
    removeUnreferencedResources: boolean;
}

export interface WasmQPDFWrapper {
    processMemoryFile(data: Uint8Array, password?: string): void;
    getNumPages(): number;
    getPDFVersion(): string;
    isEncrypted(): boolean;
    isLinearized(): boolean;
    // metadata accessors are optional because minimal WASM builds may omit them
    getTitle?(): string;
    getAuthor?(): string;
    getSubject?(): string;
    getCreator?(): string;
    delete(): void;
}

export interface WasmQPDFWriter {
    setCompressionLevel(level: number): void;
    setDecodeLevel(level: string): void;
    setRecompressFlate(value: boolean): void;
    setObjectStreamMode(mode: string): void;
    // advanced writer options are optional depending on the embind build
    setCompressPages?(value: boolean): void;
    setRemoveUnreferencedResources?(value: boolean): void;
    write(): void;
    getBuffer(): Uint8Array;
    delete(): void;
}

export type WasmPixelColorModel = "unknown" | "gray" | "rgb" | "cmyk";
export type WasmColorComponentCount = 0 | 1 | 3 | 4;

// raw image record from the WASM extractImages binding
export interface WasmExtractedImage {
    objectKey: string;
    xobjectKey: string;
    pageIndex: number;
    filter: string;
    width: number;
    height: number;
    bitsPerComponent: number;
    colorSpace: string;
    // resolved pdf color component count kept for metadata compatibility
    components: WasmColorComponentCount;
    // raw pixel interpretation supported by the browser encoder
    pixelColorModel: WasmPixelColorModel;
    hasMask: boolean;
    hasSMask: boolean;
    isImageMask: boolean;
    strategy: "encoded" | "raw-pixels" | "unsupported" | "error";
    bytes: Uint8Array;
}

export interface QpdfWasmModule {
    compressPdf(data: Uint8Array, options: WasmCompressionOptions): Uint8Array;
    splitPages(data: Uint8Array): Uint8Array[];
    mergePdfs(inputs: Uint8Array[]): Uint8Array;
    extractImages(data: Uint8Array): WasmExtractedImage[];
    getVersion(): string;
    getQpdfVersion?: () => string;
    QPDFWrapper: new () => WasmQPDFWrapper;
    QPDF?: new () => WasmQPDFWrapper;
    QPDFWriter: new (qpdf: WasmQPDFWrapper) => WasmQPDFWriter;
}

/**
 * Factory function that returns the WASM module
 */
export type CreateQpdfModule = () => Promise<QpdfWasmModule>;
