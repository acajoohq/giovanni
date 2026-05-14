import { GhostscriptInitError } from "../errors.js";
import { createSingletonEmscriptenModuleLoader } from "../shared/wasm-loader.js";
import type { GhostscriptModuleOptions, GhostscriptWasmModule } from "../../types/wasm-module.js";
import type { GhostscriptLogCapture } from "./runtime.js";

let activeCapture: GhostscriptLogCapture | null = null;

const loader = createSingletonEmscriptenModuleLoader<GhostscriptWasmModule, GhostscriptModuleOptions>({
    resolveFrom: import.meta.url,
    moduleFileName: "./ghostscript.js",
    exportNames: ["default", "createGhostscriptModule"],
    createModuleOptions() {
        return {
            noInitialRun: true,
            locateFile(path) {
                if (path === "gs.wasm") {
                    return new URL("./ghostscript.wasm", import.meta.url).href;
                }

                return new URL(`./${path}`, import.meta.url).href;
            },
            print(line) {
                activeCapture?.stdout.push(String(line));
            },
            printErr(line) {
                activeCapture?.stderr.push(String(line));
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

export async function withGhostscriptModule<T>(
    capture: GhostscriptLogCapture,
    operation: (module: GhostscriptWasmModule) => Promise<T>
): Promise<T> {
    const module = await initGhostscriptModule();
    activeCapture = capture;

    try {
        return await operation(module);
    } finally {
        activeCapture = null;
    }
}

export function resetGhostscriptModule(): void {
    activeCapture = null;
    loader.reset();
}
