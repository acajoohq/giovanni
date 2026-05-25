import { getQpdfBinding } from "../../bindings/index.js";
import { QpdfValidationError } from "../../errors/index.js";
import { toUint8Array } from "../../utils/buffer.js";
import type { OpenDocumentOptions, QpdfDocumentInfo, WriteOptions } from "../../types/index.js";
import { validateQpdfWriteOptions } from "./options.js";

/**
 * Advanced qpdf document for reusable workflows.
 *
 * Useful when you need to inspect a PDF and conditionally write it — keeps the
 * parsed document in memory so you don't pay the parse cost twice.
 *
 * The active binding (WASM, JSI, …) is resolved at runtime via the binding
 * registry. Switch bindings via {@link setQpdfBinding} from `@pdfly/wasm/bindings`.
 *
 * @example
 * ```typescript
 * // Inspect the PDF once, then choose an optimization preset based on its content
 * const document = await QpdfDocument.open(pdfBytes);
 *
 * const optimizedPdfBytes = await document.write({ linearize: document.pageCount < 10 });
 *
 * document.dispose();
 * ```
 */
export class QpdfDocument {
    private cachedInfo: QpdfDocumentInfo | null = null;
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
        const inputBuffer = toUint8Array(input);
        this.dispose();
        const info = await getQpdfBinding().getDocumentInfo(inputBuffer, options?.password);
        this.cachedInfo = info as QpdfDocumentInfo;
        this.storedInput = inputBuffer;
        this.storedOpenOptions = options;
        this.initialized = true;
    }

    /**
     * Get the number of pages in the PDF
     */
    get pageCount(): number {
        return this.getInfo().numPages;
    }

    /**
     * Get the PDF version (e.g., "1.4", "1.7")
     */
    get pdfVersion(): string {
        return this.getInfo().pdfVersion;
    }

    /**
     * Check if the PDF is encrypted
     */
    get isEncrypted(): boolean {
        return this.getInfo().isEncrypted;
    }

    /**
     * Check if the PDF is linearized (optimized for web viewing)
     */
    get isLinearized(): boolean {
        return this.getInfo().isLinearized;
    }

    /**
     * Get comprehensive PDF metadata
     */
    info(): QpdfDocumentInfo {
        return { ...this.getInfo() };
    }

    /**
     * Write the PDF with the given options. Safe to call multiple times with different
     * options — each call processes a fresh instance so mutations don't accumulate.
     */
    async write(options?: WriteOptions): Promise<Uint8Array> {
        if (!this.storedInput) {
            throw new QpdfValidationError("Document not open. Call QpdfDocument.open() first.");
        }
        const writeOptions = validateQpdfWriteOptions(options);
        return getQpdfBinding().writePdf(this.storedInput, writeOptions, this.storedOpenOptions?.password);
    }

    /**
     * Clean up resources
     */
    dispose(): void {
        this.cachedInfo = null;
        this.storedInput = null;
        this.storedOpenOptions = undefined;
        this.initialized = false;
    }

    private getInfo(): QpdfDocumentInfo {
        if (!this.initialized || !this.cachedInfo) {
            throw new QpdfValidationError("QpdfDocument is not open. Call QpdfDocument.open() first.");
        }
        return this.cachedInfo;
    }
}
