import { defineConfig } from "tsdown";

export default defineConfig({
    entry: {
        index: "src/index.ts",
        "pdfjs.browser": "src/pdfjs/browser.ts",
        "pdfjsLegacy.browser": "src/pdfjs/legacy.browser.ts",
    },
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    minify: false,
    sourcemap: true,
    publint: {
        level: "error",
    },
    attw: {
        profile: "node16",
        level: "error",
    },
});
