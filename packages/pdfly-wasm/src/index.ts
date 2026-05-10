/**
 * @pdfly/wasm - qpdf WebAssembly API for local-first PDF workflows.
 */

// qpdf api
export { initQpdf, getQpdfVersion, linearizePdf, optimizePdf } from "./core/compress.js";
export { inspectPdf, checkPdf } from "./core/inspect.js";
export { splitPdf } from "./core/split.js";
export { mergePdfs } from "./core/merge.js";
export { organizePdf } from "./core/organize.js";
export { extractImages } from "./core/extract-images.js";

// advanced api
export { QpdfDocument } from "./core/qpdf.js";

// error classes
export {
    isQpdfError,
    QpdfError,
    QpdfInitError,
    QpdfCompressionError,
    QpdfSplitError,
    QpdfMergeError,
    QpdfValidationError,
    QpdfImageExtractionError,
    QpdfConversionError,
    QpdfOrganizeError,
} from "./core/errors.js";

// types
export type {
    CheckOptions,
    DecodeLevel,
    InspectOptions,
    ObjectStreamMode,
    OpenDocumentOptions,
    OptimizeOptions,
    OrganizeOptions,
    PdfData,
    PdfInput,
    QpdfOptimizePreset,
    WriteOptions,
    OptimizeResult,
    SplitResult,
    MergeResult,
    QpdfCheckResult,
    QpdfDocumentInfo,
    ExtractedImage,
    ExtractImagesResult,
    OrganizeResult,
} from "./types/index.js";

// utility functions
export { formatBytes, calculateSavings, formatPercentage } from "./utils/format.js";
export { PRESETS } from "./utils/validation.js";
