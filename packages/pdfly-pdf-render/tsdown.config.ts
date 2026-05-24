import { defineConfig } from "tsdown";

export default defineConfig({
    entry: ["src/index.ts", "src/pdfjsLegacy.browser.ts"],
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
