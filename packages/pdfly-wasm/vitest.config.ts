import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

// When running tests from source, the module-loader resolves qpdf.js relative
// to src/core/ (its own location). That file doesn't exist there — it lives in
// build/wasm/ and is copied to dist/ only after a full build. This plugin
// rewrites the URL expression in module-loader so the real WASM is loaded
// without needing to build first.
const wasmJsUrl = pathToFileURL(resolve(__dirname, "build/wasm/qpdf.js")).href;

export default defineConfig({
    plugins: [
        {
            name: "vitest-wasm-path",
            transform(code, id) {
                if (/module-loader\.(ts|js)$/.test(id) && !id.includes("node_modules")) {
                    return {
                        code: code.replace(/new URL\(["']\.\/qpdf\.js["'],\s*import\.meta\.url\)\.href/, JSON.stringify(wasmJsUrl)),
                        map: null,
                    };
                }
            },
        },
    ],
    test: {
        globals: true,
        environment: "node",
        setupFiles: ["./src/test/setup.ts"],
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            exclude: ["node_modules/", "dist/", "build/", "**/*.d.ts", "**/*.config.ts", "**/*.test.ts"],
        },
    },
});
