import { initQpdfModule } from "./module-loader.js";
import { QpdfCompressionError, QpdfValidationError } from "./errors.js";
import type { QPDF } from "./qpdf.js";
import type { DecodeLevel, ObjectStreamMode } from "../types/options.js";
import type { WasmQPDFWriter } from "../types/wasm-module.js";

/**
 * Advanced QPDFWriter class for fine-grained compression control
 *
 * @example
 * ```typescript
 * const qpdf = new QPDF();
 * await qpdf.processMemoryFile(pdfBytes);
 *
 * const writer = new QPDFWriter(qpdf);
 * writer.setCompressionLevel(9);
 * writer.setDecodeLevel('all');
 * writer.setRecompressFlate(true);
 * writer.setObjectStreamMode('generate');
 *
 * await writer.write();
 * const compressedData = writer.getBuffer();
 *
 * // Clean up
 * writer.cleanup();
 * qpdf.cleanup();
 * ```
 */
export class QPDFWriter {
    private wasmInstance: WasmQPDFWriter | null = null;
    private initialized = false;

    /**
     * Create a new QPDFWriter for the given QPDF instance
     */
    constructor(private qpdf: QPDF) {}

    /**
     * Initialize the writer (called automatically by setter methods)
     */
    private async ensureInitialized(): Promise<void> {
        if (this.initialized && this.wasmInstance) {
            return;
        }

        try {
            const module = await initQpdfModule();
            const qpdfWasm = this.qpdf.getWasmInstance();
            this.wasmInstance = new module.QPDFWriter(qpdfWasm);
            this.initialized = true;
        } catch (error) {
            throw new QpdfCompressionError("Failed to initialize QPDFWriter", { cause: error });
        }
    }

    /**
     * Set compression level (1-9)
     */
    async setCompressionLevel(level: number): Promise<void> {
        if (!Number.isInteger(level) || level < 1 || level > 9) {
            throw new QpdfValidationError("Compression level must be an integer between 1 and 9");
        }
        await this.ensureInitialized();
        this.wasmInstance!.setCompressionLevel(level);
    }

    /**
     * Set decode level
     */
    async setDecodeLevel(level: DecodeLevel): Promise<void> {
        const validLevels: DecodeLevel[] = ["none", "generalized", "specialized", "all"];
        if (!validLevels.includes(level)) {
            throw new QpdfValidationError(`Decode level must be one of: ${validLevels.join(", ")}`);
        }
        await this.ensureInitialized();
        this.wasmInstance!.setDecodeLevel(level);
    }

    /**
     * Set whether to recompress flate streams
     */
    async setRecompressFlate(value: boolean): Promise<void> {
        await this.ensureInitialized();
        this.wasmInstance!.setRecompressFlate(value);
    }

    /**
     * Set object stream mode
     */
    async setObjectStreamMode(mode: ObjectStreamMode): Promise<void> {
        const validModes: ObjectStreamMode[] = ["preserve", "disable", "generate"];
        if (!validModes.includes(mode)) {
            throw new QpdfValidationError(`Object stream mode must be one of: ${validModes.join(", ")}`);
        }
        await this.ensureInitialized();
        this.wasmInstance!.setObjectStreamMode(mode);
    }

    /**
     * Set whether to compress pages
     */
    async setCompressPages(value: boolean): Promise<void> {
        await this.ensureInitialized();

        // advanced writer options are optional depending on the WASM bindings build
        if (typeof this.wasmInstance!.setCompressPages === "function") {
            this.wasmInstance!.setCompressPages(value);
            return;
        }
        throw new QpdfValidationError("setCompressPages is not available in this WASM build");
    }

    /**
     * Set whether to remove unreferenced resources
     */
    async setRemoveUnreferencedResources(value: boolean): Promise<void> {
        await this.ensureInitialized();

        // advanced writer options are optional depending on the WASM bindings build
        if (typeof this.wasmInstance!.setRemoveUnreferencedResources === "function") {
            this.wasmInstance!.setRemoveUnreferencedResources(value);
            return;
        }
        throw new QpdfValidationError("setRemoveUnreferencedResources is not available in this WASM build");
    }

    /**
     * Write the PDF with the configured settings
     */
    async write(): Promise<void> {
        await this.ensureInitialized();
        try {
            this.wasmInstance!.write();
        } catch (error) {
            throw new QpdfCompressionError("Failed to write PDF", { cause: error });
        }
    }

    /**
     * Get the compressed PDF buffer
     * Must be called after write()
     */
    getBuffer(): Uint8Array {
        if (!this.initialized || !this.wasmInstance) {
            throw new QpdfValidationError("Writer not initialized. Call write() first.");
        }
        try {
            return this.wasmInstance.getBuffer();
        } catch (error) {
            throw new QpdfCompressionError("Failed to get buffer", { cause: error });
        }
    }

    /**
     * Clean up WASM resources
     */
    cleanup(): void {
        if (this.wasmInstance) {
            this.wasmInstance.delete();
            this.wasmInstance = null;
            this.initialized = false;
        }
    }
}
