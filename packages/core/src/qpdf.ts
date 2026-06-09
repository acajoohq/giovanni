import { getQpdfBinding } from "./bindings/index.js";
import { QpdfDocument } from "./engines/qpdf/document.js";
import { QPDF_PRESETS } from "./engines/qpdf/options.js";
import { compressPdfWithQpdf, optimizePdf, linearizePdf } from "./engines/qpdf/optimize.js";

export async function initQpdf(): Promise<void> {
    await getQpdfBinding().init();
}

export async function getQpdfVersion(): Promise<string> {
    return getQpdfBinding().getVersion();
}

export { compressPdfWithQpdf, linearizePdf, optimizePdf, QpdfDocument, QPDF_PRESETS };

export type { DecodeLevel, ObjectStreamMode, OptimizeOptions, OptimizeResult, QpdfCheckResult, QpdfDocumentInfo, QpdfOptimizePreset, WriteOptions } from "./types/qpdf.types.js";
