import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Engine module loaders resolve ./qpdf.js / ./ghostscript.js next to src/engines/*,
// but the built artifacts live under build/qpdf and build/ghostscript.
const qpdfJsUrl = pathToFileURL(resolve(__dirname, "build/qpdf/qpdf.js")).href;
const ghostscriptJsUrl = pathToFileURL(resolve(__dirname, "build/ghostscript/ghostscript.js")).href;

export default defineConfig({
    plugins: [
        {
            name: "vitest-wasm-path",
            transform(code, id) {
                if (/engines\/qpdf\/module-loader\.(ts|js)$/.test(id) && !id.includes("node_modules")) {
                    return {
                        code: code.replace('moduleFileName: "./qpdf.js"', `moduleFileName: ${JSON.stringify(qpdfJsUrl)}`),
                        map: null,
                    };
                }
                if (/engines\/ghostscript\/module-loader\.(ts|js)$/.test(id) && !id.includes("node_modules")) {
                    return {
                        code: code.replace('moduleFileName: "./ghostscript.js"', `moduleFileName: ${JSON.stringify(ghostscriptJsUrl)}`),
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
        reporters: ["verbose"],
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            exclude: ["node_modules/", "dist/", "build/", "**/*.d.ts", "**/*.config.ts", "**/*.test.ts"],
        },
    },
});
