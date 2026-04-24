import { initQpdfModule } from "./module-loader.js";
import { QpdfCompressionError, QpdfValidationError } from "./errors.js";
import { normalizeBuffer } from "../utils/validation.js";
import type { QPDFInfo } from "../types/results.js";
import type { WasmQPDFWrapper } from "../types/wasm-module.js";

/**
 * Advanced QPDF class for fine-grained PDF manipulation
 *
 * @example
 * ```typescript
 * const qpdf = new QPDF();
 * await qpdf.processMemoryFile(pdfBytes);
 *
 * console.log(`Pages: ${qpdf.getNumPages()}`);
 * console.log(`Version: ${qpdf.getPDFVersion()}`);
 * console.log(`Encrypted: ${qpdf.isEncrypted()}`);
 *
 * const info = qpdf.getInfo();
 * console.log('PDF Info:', info);
 * ```
 */
export class QPDF {
  private wasmInstance: WasmQPDFWrapper | null = null;
  private initialized = false;

  /**
   * Load a PDF from memory
   *
   * @param input - PDF file as Uint8Array or ArrayBuffer
   * @param password - Optional password for encrypted PDFs
   */
  async processMemoryFile(input: Uint8Array | ArrayBuffer, password?: string): Promise<void> {
    try {
      const module = await initQpdfModule();
      const inputBuffer = normalizeBuffer(input);

      // Create new WASM wrapper instance
      this.wasmInstance = new module.QPDFWrapper();
      this.wasmInstance.processMemoryFile(inputBuffer, password);
      this.initialized = true;
    } catch (error) {
      this.cleanup();
      throw new QpdfCompressionError("Failed to process PDF file", { cause: error });
    }
  }

  /**
   * Get the number of pages in the PDF
   */
  getNumPages(): number {
    this.ensureInitialized();
    return this.wasmInstance!.getNumPages();
  }

  /**
   * Get the PDF version (e.g., "1.4", "1.7")
   */
  getPDFVersion(): string {
    this.ensureInitialized();
    return this.wasmInstance!.getPDFVersion();
  }

  /**
   * Check if the PDF is encrypted
   */
  isEncrypted(): boolean {
    this.ensureInitialized();
    return this.wasmInstance!.isEncrypted();
  }

  /**
   * Check if the PDF is linearized (optimized for web viewing)
   */
  isLinearized(): boolean {
    this.ensureInitialized();
    return this.wasmInstance!.isLinearized();
  }

  /**
   * Get comprehensive PDF metadata
   */
  getInfo(): QPDFInfo {
    this.ensureInitialized();

    const info: QPDFInfo = {
      numPages: this.getNumPages(),
      pdfVersion: this.getPDFVersion(),
      isEncrypted: this.isEncrypted(),
      isLinearized: this.isLinearized(),
    };

    // metadata accessors are optional depending on the WASM bindings build
    const wasm = this.wasmInstance!;
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
   * Get the internal WASM instance (for use with QPDFWriter)
   * @internal
   */
  getWasmInstance(): WasmQPDFWrapper {
    this.ensureInitialized();
    return this.wasmInstance!;
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

  /**
   * Ensure the PDF is initialized before operations
   */
  private ensureInitialized(): void {
    if (!this.initialized || !this.wasmInstance) {
      throw new QpdfValidationError(
        "QPDF instance not initialized. Call processMemoryFile() first.",
      );
    }
  }
}
