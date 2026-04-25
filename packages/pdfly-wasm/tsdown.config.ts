import { defineConfig } from "tsdown";
import { existsSync } from "node:fs";
import { copyFile, mkdir } from "node:fs/promises";

const wasmFiles = [
    { src: "build/wasm/qpdf.wasm", dest: "dist/qpdf.wasm" },
    { src: "build/wasm/qpdf.js", dest: "dist/qpdf.js" },
];

export default defineConfig({
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    minify: false,
    sourcemap: true,
    onSuccess: async () => {
        if (!existsSync("dist")) {
            await mkdir("dist", { recursive: true });
        }

        for (const { src, dest } of wasmFiles) {
            if (!existsSync(src)) {
                throw new Error(`Required WASM build artifact is missing: ${src}. Run pnpm run build:wasm before pnpm run build:lib.`);
            }

            await copyFile(src, dest);
            console.log(`Copied ${src} to ${dest}`);
        }
    },
});
