import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { codeInspectorPlugin } from "code-inspector-plugin";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
    const isTest = mode === "test";

    return {
        plugins: [
            tailwindcss(),
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
