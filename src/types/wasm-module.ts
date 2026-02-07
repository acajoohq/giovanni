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
  getTitle(): string;
  getAuthor(): string;
  getSubject(): string;
  getCreator(): string;
  delete(): void;
}

export interface WasmQPDFWriter {
  setCompressionLevel(level: number): void;
  setDecodeLevel(level: string): void;
  setRecompressFlate(value: boolean): void;
  setObjectStreamMode(mode: string): void;
  setCompressPages(value: boolean): void;
  setRemoveUnreferencedResources(value: boolean): void;
  write(): void;
  getBuffer(): Uint8Array;
  delete(): void;
}

export interface QpdfWasmModule {
  compressPdf(data: Uint8Array, options: WasmCompressionOptions): Uint8Array;
  getVersion(): string;
  QPDFWrapper: new () => WasmQPDFWrapper;
  QPDFWriter: new (qpdf: WasmQPDFWrapper) => WasmQPDFWriter;
}

/**
 * Factory function that returns the WASM module
 */
export type CreateQpdfModule = () => Promise<QpdfWasmModule>;
