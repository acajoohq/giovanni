/**
 * @pdfly/wasm - qpdf WebAssembly API for local-first PDF workflows.
 */

// qpdf api
export { compressPdf, getAvailableCompressionEngines, getQpdfVersion, initCompressionEngine, initQpdf, linearizePdf, optimizePdf } from "./core/compress.js";
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
    isGhostscriptError,
    GhostscriptError,
    GhostscriptInitError,
    GhostscriptCompressionError,
    GhostscriptValidationError,
} from "./core/errors.js";

// types
export type {
    CompressionEngine,
    CheckOptions,
    CompressOptions,
    CompressResult,
    DecodeLevel,
    GhostscriptColorConversionStrategy,
    GhostscriptCompatibilityLevel,
    GhostscriptCompressOptions,
    GhostscriptPdfSettings,
    InspectOptions,
    MergeOptions,
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

// preset constants
export { OPTIMIZE_PRESETS } from "./utils/validation.js";
