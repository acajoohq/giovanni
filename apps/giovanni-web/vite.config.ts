import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import wyw from "@wyw-in-js/vite";
import { codeInspectorPlugin } from "code-inspector-plugin";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [
        codeInspectorPlugin({
            bundler: "vite",
        }),
        wyw({
            include: ["**/*.{ts,tsx}"],
            ssrDevCss: true,
            babelOptions: {
                presets: ["@babel/preset-typescript", "@babel/preset-react"],
            },
        }),
        tanstackStart({
            prerender: {
                enabled: true,
                crawlLinks: true,
            },
        }),
        viteReact(),
    ],
});
