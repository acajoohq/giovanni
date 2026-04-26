import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin, type ResolvedConfig } from "vite";

const appDirectory = dirname(fileURLToPath(import.meta.url));
const rootDirectory = resolve(appDirectory, "../..");

function copyQpdfWasmPlugin(): Plugin {
    let config: ResolvedConfig;

    return {
        name: "copy-qpdf-wasm",
        apply: "build",
        configResolved(resolvedConfig) {
            config = resolvedConfig;
        },
        async writeBundle() {
            const sourcePath = resolve(rootDirectory, "packages/pdfly-wasm/dist/qpdf.wasm");
            const targetPath = resolve(config.root, config.build.outDir, config.build.assetsDir, "qpdf.wasm");

            await mkdir(dirname(targetPath), { recursive: true });
            await copyFile(sourcePath, targetPath);
        },
    };
}

export default defineConfig({
    plugins: [copyQpdfWasmPlugin()],
    optimizeDeps: {
        exclude: ["@pdfly/wasm"],
    },
});
