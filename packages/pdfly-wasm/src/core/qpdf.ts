import { initQpdfModule } from "./module-loader.js";
import { QpdfCompressionError, QpdfInitError, QpdfValidationError } from "./errors.js";
import { normalizeBuffer, validateWriteOptions } from "../utils/validation.js";
import type { OpenDocumentOptions, QpdfDocumentInfo, WriteOptions } from "../types/index.js";
import type { WasmQPDFWrapper } from "../types/wasm-module.js";

/**
 * Advanced qpdf document for reusable workflows.
 *
 * @example
 * ```typescript
 * const document = await QpdfDocument.open(pdfBytes);
 *
 * console.log(`Pages: ${document.pageCount}`);
 * console.log(`Version: ${document.pdfVersion}`);
 * console.log(`Encrypted: ${document.isEncrypted}`);
 *
 * const info = document.info();
 * console.log('PDF Info:', info);
 *
 * document.dispose();
 * ```
 */
export class QpdfDocument {
    private wasmInstance: WasmQPDFWrapper | null = null;
    private initialized = false;

    static async open(input: Uint8Array | ArrayBuffer, options?: OpenDocumentOptions): Promise<QpdfDocument> {
        const document = new QpdfDocument();
        await document.open(input, options);

        return document;
    }

    /**
     * Load a PDF from memory
     *
     * @param input - PDF file as Uint8Array or ArrayBuffer
     * @param password - Optional password for encrypted PDFs
     */
    async open(input: Uint8Array | ArrayBuffer, options?: OpenDocumentOptions): Promise<void> {
        try {
            const module = await initQpdfModule();
            const inputBuffer = normalizeBuffer(input);

            this.dispose();
            this.wasmInstance = new module.QPDFWrapper();
            this.wasmInstance.processMemoryFile(inputBuffer, options?.password ?? "");
            this.initialized = true;
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

    // TODO: coalesceContentStreams() and removeUnreferencedResources() permanently mutate
    // wasmInstance, so calling write() twice with different compressPages/removeUnreferencedResources
    // options produces incorrect output on the second call. Fix by storing the original input bytes
    // and re-opening a fresh instance per write(), or by adding a WASM-level clone API.
    async write(options?: WriteOptions): Promise<Uint8Array> {
        try {
            const module = await initQpdfModule();
            const wasm = this.getWasmInstance();
            const writeOptions = validateWriteOptions(options);

            if (writeOptions.compressPages) {
                wasm.coalesceContentStreams();
            }
            if (writeOptions.removeUnreferencedResources) {
                wasm.removeUnreferencedResources();
            }

            const writer = new module.QPDFWriter(wasm);

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
    }

    /**
     * Ensure the PDF is initialized before operations
     */
    private ensureInitialized(): void {
        if (!this.initialized || !this.wasmInstance) {
            throw new QpdfValidationError("QpdfDocument is not open. Call QpdfDocument.open() first.");
        }
    }
}
