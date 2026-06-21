// Ambient type declarations for the giovanni JSI globals injected by the native modules.
// - giovanni:    registered by giovanni::jsi::install(rt)   (targets/jsi/qpdf)
// - giovanni_gs: registered by giovanni::jsi::installGs(rt) (targets/jsi/ghostscript -- TODO)

import type { NativeColorComponentCount, NativePixelColorModel } from "../qpdf-binding.interface.js";

interface PdflyJsiDocumentInfo {
    numPages: number;
    pdfVersion: string;
    isEncrypted: boolean;
    isLinearized: boolean;
    title: string | undefined;
    author: string | undefined;
    subject: string | undefined;
    creator: string | undefined;
}

interface PdflyJsiExtractedImage {
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
    bytes: ArrayBuffer;
}

interface PdflyJsiGlobal {
    getVersion(): string;
    writePdf(data: ArrayBuffer, opts: object, password?: string): ArrayBuffer;
    splitPages(data: ArrayBuffer): ArrayBuffer[];
    mergePdfs(inputs: ArrayBuffer[]): ArrayBuffer;
    getDocumentInfo(data: ArrayBuffer, password?: string): PdflyJsiDocumentInfo;
    extractImages(data: ArrayBuffer): PdflyJsiExtractedImage[];
}

interface PdflyGsJsiGlobal {
    getVersion(): string;
    rewritePdf(input: ArrayBuffer, args: string[]): ArrayBuffer;
}

declare global {
    // Injected by giovanni::jsi::install(rt) -- see targets/jsi/qpdf/qpdf_jsi.h
    var giovanni: PdflyJsiGlobal | undefined;
    // Injected by giovanni::jsi::installGs(rt) -- see targets/jsi/ghostscript (TODO: not yet built)
    var giovanni_gs: PdflyGsJsiGlobal | undefined;
}

export {};
