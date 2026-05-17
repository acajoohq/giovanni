import { initQpdfModule } from "./engines/qpdf/module-loader.js";
import { QpdfDocument } from "./engines/qpdf/document.js";
import { QPDF_PRESETS } from "./engines/qpdf/options.js";
import { optimizePdf, linearizePdf } from "./operations/compress.js";

export async function initQpdf(): Promise<void> {
    await initQpdfModule();
}

export async function getQpdfVersion(): Promise<string> {
    const module = await initQpdfModule();
    return module.getVersion();
}

export { linearizePdf, optimizePdf, QpdfDocument, QPDF_PRESETS };

export type {
    DecodeLevel,
    ObjectStreamMode,
    OptimizeOptions,
    OptimizeResult,
    QpdfCheckResult,
    QpdfDocumentInfo,
    QpdfOptimizePreset,
    WriteOptions,
} from "./types/qpdf.types.js";
