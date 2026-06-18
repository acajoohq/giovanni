import tailwindcss from "@tailwindcss/vite";
import babel from "@rolldown/plugin-babel";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { codeInspectorPlugin } from "code-inspector-plugin";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, URL } from "node:url";
import { defineConfig, type Plugin } from "vite";
import appPackage from "./package.json";

const appDirectory = dirname(fileURLToPath(import.meta.url));
const rootDirectory = resolve(appDirectory, "../..");
const appVersion = appPackage.version;
const SHORT_GIT_SHA_LENGTH = 7;
const gitCommit = getGitCommit();

function getGitCommit(): string {
    const envCommit = process.env.SOURCE_SHA ?? process.env.GITHUB_SHA;

    if (envCommit) {
        return envCommit.slice(0, SHORT_GIT_SHA_LENGTH);
    }

    try {
        return execFileSync("git", ["rev-parse", `--short=${SHORT_GIT_SHA_LENGTH}`, "HEAD"], {
            cwd: rootDirectory,
            encoding: "utf8",
        }).trim();
    } catch {
        return "unknown";
    }
}

const CORE_RUNTIME_ASSETS = ["qpdf.js", "qpdf.wasm", "ghostscript.js", "ghostscript.wasm"] as const;

/**
 * Emits the Emscripten runtime files into the client build's assets directory.
 *
 * The WASM module loader computes runtime URLs relative to the bundled chunk
 * URL and imports the generated Emscripten `.js` files with `@vite-ignore`.
 * Because Vite cannot trace those ignored dynamic imports, these files must be
 * present at fixed `/assets/*` URLs in production preview/build output.
 *
 * `applyToEnvironment` limits the hook to the "client" environment so the
 * runtime files are not duplicated into the server bundle.
 */
function copyCoreRuntimeAssetsPlugin(): Plugin {
    return {
        name: "copy-core-runtime",
        apply: "build",
        applyToEnvironment(environment) {
            return environment.name === "client";
        },
        async generateBundle() {
            for (const assetFileName of CORE_RUNTIME_ASSETS) {
                const assetPath = resolve(rootDirectory, "packages/core/dist", assetFileName);
                const source = await readFile(assetPath);

                this.emitFile({
                    type: "asset",
                    fileName: `assets/${assetFileName}`,
                    source,
                });
            }
        },
    };
}

export default defineConfig(({ mode }) => {
    const isTest = mode === "test";

    return {
        plugins: [
            tailwindcss(),
            copyCoreRuntimeAssetsPlugin(),
            !isTest &&
                codeInspectorPlugin({
                    bundler: "vite",
                }),
            tanstackStart({
                prerender: {
                    enabled: true,
                    crawlLinks: true,
                },
                // Explicitly seed all locale * page paths so every locale
                // is prerendered regardless of the build system's locale.
                pages: [
                    { path: "/" },
                    { path: "/en/" },
                    { path: "/en/compress" },
                    { path: "/en/merge" },
                    { path: "/en/split" },
                    { path: "/en/organize" },
                    { path: "/en/extract-images" },
                    { path: "/en/pdf-to-jpg" },
                    { path: "/fr/" },
                    { path: "/fr/compress" },
                    { path: "/fr/merge" },
                    { path: "/fr/split" },
                    { path: "/fr/organize" },
                    { path: "/fr/extract-images" },
                    { path: "/fr/pdf-to-jpg" },
                ],
            }),
            viteReact(),
            babel({ presets: [reactCompilerPreset()] }),
        ],
        optimizeDeps: {
            exclude: ["@giovanni/pdf-render/pdfjs/browser", "@giovanni/pdf-render/pdfjs-legacy/browser"],
        },
        resolve: {
            alias: {
                "@": fileURLToPath(new URL("./src", import.meta.url)),
            },
        },
        worker: {
            format: "es",
        },
        define: {
            "import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion),
            "import.meta.env.VITE_GIT_COMMIT": JSON.stringify(gitCommit),
        },
        environments: {
            // `canvas` and `.node` binaries are pulled in by `@giovanni/core` (noExternal by TanStack Start) but can't be bundled by Rolldown.
            // `pdfjs-dist` uses DOM/Canvas APIs unavailable in Node.js — loading it during prerender crashes the SSR process.
            ssr: {
                build: {
                    rollupOptions: {
                        external: ["canvas", /\.node$/, "@giovanni/pdf-render", "@giovanni/pdf-render/pdfjs/browser", "@giovanni/pdf-render/pdfjs-legacy/browser", "pdfjs-dist"],
                    },
                },
            },
        },
    };
});
