import { QpdfInitError } from "./errors.js";
import type { QpdfWasmModule } from "../types/wasm-module.js";

let modulePromise: Promise<QpdfWasmModule> | null = null;
let moduleInstance: QpdfWasmModule | null = null;

// normalize older and newer embind export names into the public module shape
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

/**
 * Initialize the qpdf WASM module using a singleton instance.
 */
export async function initQpdfModule(): Promise<QpdfWasmModule> {
    // return cached instance if available
    if (moduleInstance) {
        return moduleInstance;
    }

    // return in-flight promise if initialization is already running
    if (modulePromise) {
        return modulePromise;
    }

    modulePromise = (async () => {
        try {
            // use a URL string so bundlers do not resolve this to src/core/qpdf.ts
            const moduleUrl = new URL("./qpdf.js", import.meta.url).href;
            const imported = await import(/* @vite-ignore */ moduleUrl);
            const createQpdfModule = (imported as { default?: unknown; createQpdfModule?: unknown }).default ?? (imported as { createQpdfModule?: unknown }).createQpdfModule;

            if (typeof createQpdfModule !== "function") {
                throw new TypeError("qpdf.js did not export a module factory function");
            }

            // call the emscripten factory function to create the module
            const module = normalizeModule(await createQpdfModule());

            moduleInstance = module;
            return module;
        } catch (error) {
            // clear the promise so initialization can be retried
            modulePromise = null;

            throw new QpdfInitError("Failed to initialize qpdf WASM module", { cause: error });
        }
    })();

    return modulePromise;
}

/**
 * Reset the module instance for tests.
 */
export function resetModule(): void {
    moduleInstance = null;
    modulePromise = null;
}
