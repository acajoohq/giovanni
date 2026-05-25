import { QpdfCompressionError, QpdfImageExtractionError, QpdfInitError, QpdfMergeError, QpdfSplitError, QpdfValidationError } from "../../errors/index.js";
import { initQpdfModule } from "../../engines/qpdf/module-loader.js";
import type { NativeDocumentInfo, NativeExtractedImage, NativeWriteOptions, QpdfBinding } from "../qpdf-binding.interface.js";

async function writePdf(data: Uint8Array, options: NativeWriteOptions, password?: string): Promise<Uint8Array> {
    try {
        const module = await initQpdfModule();
        const instance = new module.QPDFWrapper();
        try {
            instance.processMemoryFile(data, password ?? "");

            if (options.compressPages) instance.coalesceContentStreams();
            if (options.removeUnreferencedResources) instance.removeUnreferencedResources();

            const writer = new module.QPDFWriter(instance);
            try {
                writer.setCompressStreams(true);
                writer.setCompressionLevel(options.compressionLevel);
                writer.setDecodeLevel(options.decodeLevel);
                writer.setRecompressFlate(options.recompressFlate);
                writer.setObjectStreamMode(options.objectStreams);

                if (options.linearize) {
                    if (typeof writer.setLinearization !== "function") {
                        throw new QpdfValidationError("linearize is not available in this WASM build");
                    }
                    writer.setLinearization(true);
                }

                writer.write();
                return writer.getBuffer().slice();
            } finally {
                writer.delete();
            }
        } finally {
            instance.delete();
        }
    } catch (error) {
        if (error instanceof QpdfValidationError || error instanceof QpdfCompressionError || error instanceof QpdfInitError) {
            throw error;
        }
        if (error instanceof TypeError) {
            throw new QpdfValidationError(error.message, { cause: error, code: "invalid_input" });
        }
        throw new QpdfCompressionError("Failed to write PDF", { cause: error });
    }
}

async function splitPages(data: Uint8Array): Promise<Uint8Array[]> {
    const module = await initQpdfModule();
    if (typeof module.splitPages !== "function") {
        throw new QpdfSplitError("Failed to initialize PDF splitter: qpdf module is missing the splitPages export. Ensure qpdf.js and qpdf.wasm are up to date and compatible.");
    }
    const rawPages: Uint8Array[] = module.splitPages(data);
    return rawPages.map((page) => page.slice());
}

async function mergePdfs(inputs: Uint8Array[]): Promise<Uint8Array> {
    const module = await initQpdfModule();
    if (typeof module.mergePdfs !== "function") {
        throw new QpdfMergeError("Failed to initialize PDF merger: qpdf module is missing the mergePdfs export. Ensure qpdf.js and qpdf.wasm are up to date and compatible.");
    }
    return module.mergePdfs(inputs).slice();
}

async function getDocumentInfo(data: Uint8Array, password?: string): Promise<NativeDocumentInfo> {
    try {
        const module = await initQpdfModule();
        const instance = new module.QPDFWrapper();
        try {
            instance.processMemoryFile(data, password ?? "");

            const info: NativeDocumentInfo = {
                numPages: instance.getNumPages(),
                pdfVersion: instance.getPDFVersion(),
                isEncrypted: instance.isEncrypted(),
                isLinearized: instance.isLinearized(),
            };

            const title = typeof instance.getTitle === "function" ? instance.getTitle() : "";
            if (title) info.title = title;

            const author = typeof instance.getAuthor === "function" ? instance.getAuthor() : "";
            if (author) info.author = author;

            const subject = typeof instance.getSubject === "function" ? instance.getSubject() : "";
            if (subject) info.subject = subject;

            const creator = typeof instance.getCreator === "function" ? instance.getCreator() : "";
            if (creator) info.creator = creator;

            return info;
        } finally {
            instance.delete();
        }
    } catch (error) {
        if (error instanceof QpdfValidationError || error instanceof QpdfInitError || error instanceof QpdfCompressionError) {
            throw error;
        }
        if (error instanceof TypeError) {
            throw new QpdfValidationError(error.message, { cause: error });
        }
        throw new QpdfCompressionError("Failed to process PDF file", { cause: error });
    }
}

async function extractImages(data: Uint8Array): Promise<NativeExtractedImage[]> {
    const module = await initQpdfModule();
    if (typeof module.extractImages !== "function") {
        throw new QpdfImageExtractionError("Failed to extract images: qpdf module is missing the extractImages export. Ensure qpdf.js and qpdf.wasm are up to date.");
    }
    return module.extractImages(data);
}

export const qpdfWasmBinding: QpdfBinding = {
    async init(): Promise<void> {
        await initQpdfModule();
    },

    async getVersion(): Promise<string> {
        const module = await initQpdfModule();
        return module.getVersion();
    },

    writePdf,
    splitPages,
    mergePdfs,
    getDocumentInfo,
    extractImages,
};
