import { defineConfig } from "vite";

export default defineConfig({
    optimizeDeps: {
        // qpdf.js / ghostscript.js are Emscripten-generated loaders pulled in at
        // runtime via a computed `import(/* @vite-ignore */ moduleUrl)` (see
        // packages/core/src/runtime/wasm-module.loader.ts). esbuild's dependency
        // scanner still reaches them through the static imports below and tries
        // to pre-bundle them, which breaks their relative-path WASM loading.
        exclude: ["@acajoo/giovanni-core", "@acajoo/giovanni-core/qpdf", "@acajoo/giovanni-core/ghostscript"],
    },
});

