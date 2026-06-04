/**
 * @giovanni/core - qpdf WebAssembly API for local-first PDF workflows.
 */

// compression api
export { compressPdf, getAvailableCompressionEngines, initCompressionEngine } from "./operations/compress.js";

// pdf operations
export { inspectPdf, checkPdf } from "./operations/inspect.js";
export { splitPdf } from "./operations/split.js";
export { mergePdfs } from "./operations/merge.js";
export { organizePdf } from "./operations/organize.js";
export { extractImages } from "./operations/extract-images.js";

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
    ColorComponentCount,
    ExtractedImage,
    ExtractImagesResult,
    InspectOptions,
    MergeResult,
    OrganizeOptions,
    OrganizeResult,
    PdfData,
    PdfInput,
    PixelColorModel,
    QpdfCheckResult,
    QpdfDocumentInfo,
    SplitResult,
} from "./types/index.js";

// binding registry — swap WASM for JSI, native addons, or test stubs
export { getQpdfBinding, setQpdfBinding, resetQpdfBinding, getGhostscriptBinding, setGhostscriptBinding, resetGhostscriptBinding } from "./bindings/index.js";
export type {
    GhostscriptBinding,
    NativeColorComponentCount,
    NativeDocumentInfo,
    NativeExtractedImage,
    NativePixelColorModel,
    NativeWriteOptions,
    QpdfBinding,
} from "./bindings/index.js";

// utility functions
export { formatBytes, calculateSavings, formatPercentage } from "./utils/format.js";
