/**
 * @pdfly/wasm - Modern WebAssembly build of qpdf for PDF compression and manipulation
 *
 * @example Simple API
 * ```typescript
 * import { compressPdf } from '@pdfly/wasm';
 *
 * const pdfBytes = await fetch('document.pdf').then(r => r.arrayBuffer());
 * const result = await compressPdf(pdfBytes, {
 *   compressionLevel: 9,
 *   decodeLevel: 'all'
 * });
 *
 * console.log(`Saved ${result.savedBytes} bytes`);
 * ```
 *
 * @example Advanced API
 * ```typescript
 * import { QPDF, QPDFWriter } from '@pdfly/wasm';
 *
 * const qpdf = new QPDF();
 * await qpdf.processMemoryFile(pdfBytes);
 *
 * const writer = new QPDFWriter(qpdf);
 * await writer.setCompressionLevel(9);
 * await writer.write();
 * const compressed = writer.getBuffer();
 *
 * writer.cleanup();
 * qpdf.cleanup();
 * ```
 */

// simple api
export { initQpdf, getVersion, compressPdf } from "./core/compress.js";
export { splitPages } from "./core/split.js";
export { mergePdfs } from "./core/merge.js";
export { extractImages } from "./core/extract-images.js";
export { pdfToJpg } from "./core/pdf-to-jpg.js";

// advanced api
export { QPDF } from "./core/qpdf.js";
export { QPDFWriter } from "./core/writer.js";

// error classes
export {
    QpdfError,
    QpdfInitError,
    QpdfCompressionError,
    QpdfSplitError,
    QpdfMergeError,
    QpdfValidationError,
    QpdfImageExtractionError,
    QpdfConversionError,
} from "./core/errors.js";

// types
export type {
    CompressionOptions,
    DecodeLevel,
    ObjectStreamMode,
    CompressionResult,
    SplitResult,
    MergeResult,
    QPDFInfo,
    ExtractedImage,
    ExtractImagesResult,
    PdfPageJpg,
    PdfToJpgResult,
    PdfToJpgOptions,
} from "./types/index.js";

// utility functions
export { formatBytes, calculateSavings, formatPercentage } from "./utils/format.js";
export { bufferToBlob, createDownloadUrl, downloadBuffer } from "./utils/buffer.js";
