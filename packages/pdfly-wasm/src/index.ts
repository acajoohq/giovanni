/**
 * @pdfly/wasm - qpdf WebAssembly API for local-first PDF workflows.
 */

// qpdf api
export {
    compressPdf,
    getAvailableCompressionEngines,
    getGhostscriptVersion,
    getQpdfVersion,
    initCompressionEngine,
    initQpdf,
    linearizePdf,
    optimizePdf,
} from "./operations/compress.js";
export { inspectPdf, checkPdf } from "./operations/inspect.js";
export { splitPdf } from "./operations/split.js";
export { mergePdfs } from "./operations/merge.js";
export { organizePdf } from "./operations/organize.js";
export { extractImages } from "./operations/extract-images.js";

// advanced api
export { QpdfDocument } from "./engines/qpdf/document.js";

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
} from "./errors/index.js";

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
export { QPDF_PRESETS } from "./engines/qpdf/options.js";
export { GHOSTSCRIPT_PRESETS } from "./engines/ghostscript/options.js";
