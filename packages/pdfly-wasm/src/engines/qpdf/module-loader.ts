import { QpdfInitError } from "../../errors/index.js";
import { createSingletonEmscriptenModuleLoader } from "../../runtime/wasmModule.loader.js";
import type { QpdfWasmModule } from "../../types/wasm.types.js";

function normalizeModule(module: unknown): QpdfWasmModule {
    const normalized = module as QpdfWasmModule & {
        getQpdfVersion?: () => string;
        QPDF?: QpdfWasmModule["QPDFWrapper"];
    };

    if (typeof normalized.getVersion !== "function" && typeof normalized.getQpdfVersion === "function") {
        normalized.getVersion = normalized.getQpdfVersion.bind(normalized);
    }

    if (typeof normalized.QPDFWrapper !== "function" && typeof normalized.QPDF === "function") {
        normalized.QPDFWrapper = normalized.QPDF;
    }

    if (typeof normalized.getVersion !== "function") {
        throw new TypeError("qpdf.js did not export getVersion/getQpdfVersion");
    }
    if (typeof normalized.compressPdf !== "function") {
        throw new TypeError("qpdf.js did not export compressPdf");
    }
    if (typeof normalized.QPDFWrapper !== "function") {
        throw new TypeError("qpdf.js did not export QPDF/QPDFWrapper");
    }
    if (typeof normalized.QPDFWriter !== "function") {
        throw new TypeError("qpdf.js did not export QPDFWriter");
    }

    return normalized;
}

const loader = createSingletonEmscriptenModuleLoader<QpdfWasmModule>({
    resolveFrom: import.meta.url,
    moduleFileName: "./qpdf.js",
    exportNames: ["default", "createQpdfModule"],
    normalizeModule,
    createInitError(error) {
        return new QpdfInitError("Failed to initialize qpdf WASM module", { cause: error });
    },
});

export async function initQpdfModule(): Promise<QpdfWasmModule> {
    return loader.init();
}

export function resetQpdfModule(): void {
    loader.reset();
}
