/**
 * @qpdf/wasm - Modern WebAssembly build of qpdf for PDF compression and manipulation
 *
 * @example Simple API
 * ```typescript
 * import { compressPdf } from '@qpdf/wasm';
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
 * import { QPDF, QPDFWriter } from '@qpdf/wasm';
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

// Simple API
export { initQpdf, getVersion, compressPdf } from './core/compress.js';

// Advanced API
export { QPDF } from './core/qpdf.js';
export { QPDFWriter } from './core/writer.js';

// Error classes
export {
  QpdfError,
  QpdfInitError,
  QpdfCompressionError,
  QpdfValidationError,
} from './core/errors.js';

// Types
export type {
  CompressionOptions,
  DecodeLevel,
  ObjectStreamMode,
  CompressionResult,
  QPDFInfo,
} from './types/index.js';

// Utility functions (for convenience)
export { formatBytes, calculateSavings, formatPercentage } from './utils/format.js';
export { bufferToBlob, createDownloadUrl, downloadBuffer } from './utils/buffer.js';

// Default export for convenience
export { compressPdf as default } from './core/compress.js';
