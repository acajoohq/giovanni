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
        return execFileSync("git", ["rev-parse", `--short=${SHORT_GIT_SHA_LENGTH}`, "HEAD"], { cwd: rootDirectory, encoding: "utf8" }).trim();
    } catch {
        return "unknown";
    }
}

/**
 * Emits `qpdf.wasm` into the client build's assets directory so that the
 * Emscripten runtime in `qpdf.js` can fetch it at `<origin>/assets/qpdf.wasm`.
 *
 * Vite automatically emits `qpdf.js` (via the `new URL(…, import.meta.url)`
 * pattern in module-loader.ts) but it cannot statically trace the `.wasm`
 * binary that Emscripten fetches at runtime — hence it must be explicitly
 * emitted here. The desktop app uses the same strategy.
 *
 * `applyToEnvironment` limits the hook to the "client" environment so the
 * binary is not duplicated into the server bundle.
 */
function copyQpdfWasmPlugin(): Plugin {
    return {
        name: "copy-qpdf-wasm",
        apply: "build",
        applyToEnvironment(environment) {
            return environment.name === "client";
        },
        async generateBundle() {
            const wasmPath = resolve(rootDirectory, "packages/pdfly-wasm/dist/qpdf.wasm");
            const source = await readFile(wasmPath);

            this.emitFile({
                type: "asset",
                // Fixed path (no hash) so Emscripten can resolve it relative to
                // the hashed `qpdf-[hash].js` script that lives in the same dir.
                fileName: "assets/qpdf.wasm",
                source,
            });
        },
    };
}

export default defineConfig(({ mode }) => {
    const isTest = mode === "test";

    return {
        plugins: [
            tailwindcss(),
            copyQpdfWasmPlugin(),
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
            babel({ presets: [reactCompilerPreset()] }),
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
        define: {
            "import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion),
            "import.meta.env.VITE_GIT_COMMIT": JSON.stringify(gitCommit),
        },
        environments: {
            // `canvas` and `.node` binaries are pulled in by `@pdfly/wasm` (noExternal by TanStack Start) but can't be bundled by Rolldown.
            // `pdfjs-dist` uses DOM/Canvas APIs unavailable in Node.js — loading it during prerender crashes the SSR process.
            ssr: {
                build: {
                    rollupOptions: {
                        external: ["canvas", /\.node$/, "pdfjs-dist"],
                    },
                },
            },
        },
    };
});
