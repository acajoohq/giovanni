import { initQpdfModule } from "./qpdf/module-loader.js";
import { QpdfCompressionError, QpdfInitError, QpdfValidationError } from "./errors.js";
import { normalizeBuffer, validateOptimizeOptions } from "../utils/validation.js";
import type { OpenDocumentOptions, OptimizeOptions, QpdfDocumentInfo } from "../types/index.js";
import type { WasmQPDFWrapper } from "../types/wasm-module.js";

/**
 * Advanced qpdf document for reusable workflows.
 *
 * Useful when you need to inspect a PDF and conditionally write it — keeps the
 * parsed document in memory so you don't pay the parse cost twice.
 *
 * @example
 * ```typescript
 * // Inspect the PDF once, then choose an optimization preset based on its content
 * const document = await QpdfDocument.open(pdfBytes);
 *
 * const preset = document.pageCount > 50 ? "archive" : "web";
 * const optimizedPdfBytes = await document.write({ preset });
 *
 * document.dispose();
 * ```
 */
export class QpdfDocument {
    private wasmInstance: WasmQPDFWrapper | null = null;
    private initialized = false;
    private storedInput: Uint8Array | null = null;
    private storedOpenOptions: OpenDocumentOptions | undefined;

    static async open(input: Uint8Array | ArrayBuffer, options?: OpenDocumentOptions): Promise<QpdfDocument> {
        const document = new QpdfDocument();
        await document.open(input, options);

        return document;
    }

    /**
     * Load a PDF from memory
     *
     * @param input - PDF file as Uint8Array or ArrayBuffer
     * @param options - Optional open options (e.g. password for encrypted PDFs)
     */
    async open(input: Uint8Array | ArrayBuffer, options?: OpenDocumentOptions): Promise<void> {
        try {
            const module = await initQpdfModule();
            const inputBuffer = normalizeBuffer(input);

            this.dispose();
            this.wasmInstance = new module.QPDFWrapper();
            this.wasmInstance.processMemoryFile(inputBuffer, options?.password ?? "");
            this.initialized = true;
            this.storedInput = inputBuffer;
            this.storedOpenOptions = options;
        } catch (error) {
            this.dispose();
            if (error instanceof QpdfValidationError || error instanceof QpdfInitError || error instanceof QpdfCompressionError) {
                throw error;
            }
            throw new QpdfCompressionError("Failed to process PDF file", { cause: error });
        }
    }

    /**
     * Get the number of pages in the PDF
     */
    get pageCount(): number {
        return this.getWasmInstance().getNumPages();
    }

    /**
     * Get the PDF version (e.g., "1.4", "1.7")
     */
    get pdfVersion(): string {
        return this.getWasmInstance().getPDFVersion();
    }

    /**
     * Check if the PDF is encrypted
     */
    get isEncrypted(): boolean {
        return this.getWasmInstance().isEncrypted();
    }

    /**
     * Check if the PDF is linearized (optimized for web viewing)
     */
    get isLinearized(): boolean {
        return this.getWasmInstance().isLinearized();
    }

    /**
     * Get comprehensive PDF metadata
     */
    info(): QpdfDocumentInfo {
        const info: QpdfDocumentInfo = {
            numPages: this.pageCount,
            pdfVersion: this.pdfVersion,
            isEncrypted: this.isEncrypted,
            isLinearized: this.isLinearized,
        };

        // metadata accessors are optional depending on the WASM bindings build
        const wasm = this.getWasmInstance();
        const title = typeof wasm.getTitle === "function" ? wasm.getTitle() : "";
        if (title) info.title = title;

        const author = typeof wasm.getAuthor === "function" ? wasm.getAuthor() : "";
        if (author) info.author = author;

        const subject = typeof wasm.getSubject === "function" ? wasm.getSubject() : "";
        if (subject) info.subject = subject;

        const creator = typeof wasm.getCreator === "function" ? wasm.getCreator() : "";
        if (creator) info.creator = creator;

        return info;
    }

    /**
     * Write the PDF with the given options. Safe to call multiple times with different
     * options — each call processes a fresh instance so mutations don't accumulate.
     */
    async write(options?: OptimizeOptions): Promise<Uint8Array> {
        if (!this.storedInput) {
            throw new QpdfValidationError("Document not open. Call QpdfDocument.open() first.");
        }

        try {
            const module = await initQpdfModule();
            const writeOptions = validateOptimizeOptions(options);

            const writeInstance = new module.QPDFWrapper();
            try {
                writeInstance.processMemoryFile(this.storedInput, this.storedOpenOptions?.password ?? "");

                if (writeOptions.compressPages) writeInstance.coalesceContentStreams();
                if (writeOptions.removeUnreferencedResources) writeInstance.removeUnreferencedResources();

                const writer = new module.QPDFWriter(writeInstance);
                try {
                    writer.setCompressStreams(true);
                    writer.setCompressionLevel(writeOptions.compressionLevel);
                    writer.setDecodeLevel(writeOptions.decodeLevel);
                    writer.setRecompressFlate(writeOptions.recompressFlate);
                    writer.setObjectStreamMode(writeOptions.objectStreams);

                    if (writeOptions.linearize) {
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
                writeInstance.delete();
            }
        } catch (error) {
            if (error instanceof QpdfValidationError || error instanceof QpdfCompressionError) {
                throw error;
            }
            throw new QpdfCompressionError("Failed to write PDF", { cause: error });
        }
    }

    /**
     * Get the internal WASM instance for package-internal writer plumbing.
     * @internal
     */
    getWasmInstance(): WasmQPDFWrapper {
        this.ensureInitialized();
        if (!this.wasmInstance) {
            throw new QpdfValidationError("QpdfDocument is not open. Call QpdfDocument.open() first.");
        }
        return this.wasmInstance;
    }

    /**
     * Clean up WASM resources
     */
    dispose(): void {
        if (this.wasmInstance) {
            this.wasmInstance.delete();
            this.wasmInstance = null;
            this.initialized = false;
        }
        this.storedInput = null;
        this.storedOpenOptions = undefined;
    }

    private ensureInitialized(): void {
        if (!this.initialized || !this.wasmInstance) {
            throw new QpdfValidationError("QpdfDocument is not open. Call QpdfDocument.open() first.");
        }
    }
}
