import { defineConfig } from "tsdown";

export default defineConfig({
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    minify: false,
    sourcemap: true,
    copy: [
        { from: "build/wasm/qpdf.js", to: "dist", verbose: true },
        { from: "build/wasm/qpdf.wasm", to: "dist", verbose: true },
    ],
    publint: {
        level: "error",
    },
    attw: {
        profile: "node16",
        level: "error",
    },
});
