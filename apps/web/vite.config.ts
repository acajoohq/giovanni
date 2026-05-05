import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { codeInspectorPlugin } from "code-inspector-plugin";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, URL } from "node:url";
import { defineConfig, type Plugin } from "vite";

const appDirectory = dirname(fileURLToPath(import.meta.url));
const rootDirectory = resolve(appDirectory, "../..");

/**
 * Emits `qpdf.wasm` into the client build's assets directory so that the
 * Emscripten runtime in `qpdf.js` can fetch it at `<origin>/assets/qpdf.wasm`.
 *
 * Vite automatically emits `qpdf.js` (via the `new URL(…, import.meta.url)`
 * pattern in module-loader.ts) but it cannot statically trace the `.wasm`
 * binary that Emscripten fetches at runtime — hence it must be explicitly
 * emitted here. The desktop app uses the same strategy.
 *
 * `applyToEnvironment` limits the hook to the "client" environment so the
 * binary is not duplicated into the server bundle.
 */
function copyQpdfWasmPlugin(): Plugin {
    return {
        name: "copy-qpdf-wasm",
        apply: "build",
        applyToEnvironment(environment) {
            return environment.name === "client";
        },
        async generateBundle() {
            const wasmPath = resolve(rootDirectory, "packages/pdfly-wasm/dist/qpdf.wasm");
            const source = await readFile(wasmPath);

            this.emitFile({
                type: "asset",
                // Fixed path (no hash) so Emscripten can resolve it relative to
                // the hashed `qpdf-[hash].js` script that lives in the same dir.
                fileName: "assets/qpdf.wasm",
                source,
            });
        },
    };
}

export default defineConfig(({ mode }) => {
    const isTest = mode === "test";

    return {
        plugins: [
            tailwindcss(),
            copyQpdfWasmPlugin(),
            !isTest &&
                codeInspectorPlugin({
                    bundler: "vite",
                }),
            tanstackStart({
                prerender: {
                    enabled: true,
                    crawlLinks: true,
                },
            }),
            viteReact(),
        ],
        optimizeDeps: {
            exclude: ["pdfjs-dist"],
        },
        resolve: {
            alias: {
                "@": fileURLToPath(new URL("./src", import.meta.url)),
            },
        },
        worker: {
            format: "es",
        },
    };
});
