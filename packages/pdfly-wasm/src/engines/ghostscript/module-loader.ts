import { GhostscriptInitError } from "../../errors/index.js";
import { createSingletonEmscriptenModuleLoader } from "../../runtime/wasm-loader.js";
import type { GhostscriptModuleOptions, GhostscriptWasmModule } from "../../types/wasm-module.js";

function normalizeModule(module: unknown): GhostscriptWasmModule {
    const normalized = module as GhostscriptWasmModule & {
        getGhostscriptVersion?: () => string;
    };

    if (typeof normalized.getVersion !== "function" && typeof normalized.getGhostscriptVersion === "function") {
        normalized.getVersion = normalized.getGhostscriptVersion.bind(normalized);
    }

    if (typeof normalized.rewritePdf !== "function") {
        throw new TypeError("ghostscript.js did not export rewritePdf");
    }
    if (typeof normalized.getVersion !== "function") {
        throw new TypeError("ghostscript.js did not export getVersion/getGhostscriptVersion");
    }

    return normalized;
}

const loader = createSingletonEmscriptenModuleLoader<GhostscriptWasmModule, GhostscriptModuleOptions>({
    resolveFrom: import.meta.url,
    moduleFileName: "./ghostscript.js",
    exportNames: ["default", "createGhostscriptModule"],
    normalizeModule,
    createModuleOptions(moduleUrl) {
        const wasmUrl = new URL("./ghostscript.wasm", moduleUrl).href;

        return {
            noInitialRun: true,
            locateFile(path) {
                if (path === "gs.wasm" || path === "ghostscript.wasm") {
                    return wasmUrl;
                }

                return path;
            },
        };
    },
    createInitError(error) {
        return new GhostscriptInitError("Failed to initialize Ghostscript WASM module", { cause: error });
    },
});

export async function initGhostscriptModule(): Promise<GhostscriptWasmModule> {
    return loader.init();
}

export function resetGhostscriptModule(): void {
    loader.reset();
}
