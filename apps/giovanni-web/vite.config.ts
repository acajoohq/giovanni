import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [
        tanstackStart({
            prerender: {
                enabled: true,
                crawlLinks: true,
            },
        }),
        tailwindcss(),
        viteReact(),
    ],
});
