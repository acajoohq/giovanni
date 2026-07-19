import { QpdfCompressionError, QpdfImageExtractionError, QpdfInitError, QpdfMergeError, QpdfSplitError, QpdfValidationError, QpdfWatermarkError } from "../../errors/index.js";
import { initQpdfModule } from "../../engines/qpdf/module-loader.js";
import type { NativeDocumentInfo, NativeExtractedImage, NativeWatermarkOptions, NativeWriteOptions, QpdfBinding } from "../qpdf-binding.interface.js";

async function writePdf(data: Uint8Array, options: NativeWriteOptions, password?: string): Promise<Uint8Array> {
    try {
        const module = await initQpdfModule();
        const optimizedBuffer = module.compressPdf(data, options).slice();
        return optimizedBuffer;
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

            // Some damaged/object-stream-heavy PDFs can under-report page count via
            // QPDFWrapper#getNumPages while splitPages still discovers all pages.
            // Reconcile using the larger count to keep inspect/open metadata aligned
            // with page-level operations.
            try {
                if (typeof module.splitPages === "function") {
                    const discoveredPageCount = module.splitPages(data).length;
                    if (discoveredPageCount > info.numPages) {
                        info.numPages = discoveredPageCount;
                    }
                }
            } catch {
                // Keep wrapper-derived metadata when split page probing fails.
            }

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

async function watermarkPdf(data: Uint8Array, watermark: Uint8Array, options: NativeWatermarkOptions, password?: string, watermarkPassword?: string): Promise<Uint8Array> {
    try {
        const module = await initQpdfModule();
        if (typeof module.watermarkPdf !== "function") {
            throw new QpdfWatermarkError("Failed to initialize PDF watermarking: qpdf module is missing the watermarkPdf export. Ensure qpdf.js and qpdf.wasm are up to date.");
        }

        const pageIndexes = options.pages.map((page) => {
            if (!Number.isInteger(page)) {
                throw new QpdfValidationError(`Invalid page index ${page}: expected an integer`, { code: "invalid_input" });
            }
            return page;
        });

        let vectorPages: { push_back(value: number): void; delete?(): void } | null = null;
        let marshaledOptions: { underlay: boolean; pages: unknown } = {
            underlay: options.underlay,
            pages: pageIndexes,
        };

        if (typeof module.VectorInt === "function") {
            vectorPages = new module.VectorInt();
            for (const page of pageIndexes) {
                vectorPages.push_back(page);
            }
            marshaledOptions = {
                underlay: options.underlay,
                pages: vectorPages,
            };
        }

        const invokeWatermark = module.watermarkPdf as (
            data: Uint8Array,
            watermark: Uint8Array,
            options: { underlay: boolean; pages: unknown },
            password?: string,
            watermarkPassword?: string,
        ) => Uint8Array;

        try {
            return invokeWatermark(data, watermark, marshaledOptions, password ?? "", watermarkPassword ?? "").slice();
        } finally {
            vectorPages?.delete?.();
        }
    } catch (error) {
        if (error instanceof QpdfValidationError || error instanceof QpdfInitError || error instanceof QpdfWatermarkError) {
            throw error;
        }
        if (error instanceof TypeError) {
            throw new QpdfValidationError(error.message, { cause: error, code: "invalid_input" });
        }
        throw new QpdfWatermarkError("Failed to apply PDF watermark", { cause: error });
    }
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
    watermarkPdf,
};
