import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

const mock = (name: string) =>
    fileURLToPath(new URL(`./src/test/__mocks__/${name}.ts`, import.meta.url));

export default defineConfig({
    resolve: {
        alias: {
            // Redirect to lightweight mocks so tests do not need native binaries or browser globals.
            "pdfjs-dist": mock("pdfjs-dist"),
            canvas: mock("canvas"),
        },
    },
    test: {
        globals: true,
        environment: "node",
    },
});