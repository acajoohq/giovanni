import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { createSingletonEmscriptenModuleLoader, createSingletonWasmLoader } from "./wasmModule.loader.js";

describe("createSingletonWasmLoader", () => {
    it("caches the resolved module instance until reset", async () => {
        let calls = 0;
        const loader = createSingletonWasmLoader(async () => ({ id: ++calls }));

        const first = await loader.init();
        const second = await loader.init();

        expect(first).toBe(second);
        expect(calls).toBe(1);

        loader.reset();

        const third = await loader.init();

        expect(third).not.toBe(first);
        expect(calls).toBe(2);
    });
});

describe("createSingletonEmscriptenModuleLoader", () => {
    it("passes the resolved module URL into createModuleOptions", async () => {
        const directory = await mkdtemp(join(tmpdir(), "pdfly-wasm-loader-"));
        const modulePath = join(directory, "emscripten-module.mjs");
        const moduleUrl = pathToFileURL(modulePath).href;

        await writeFile(
            modulePath,
            'export default async function createModule(options) { return { options, getGhostscriptVersion: () => "10.07", rewritePdf: (data) => data }; }',
        );

        const loader = createSingletonEmscriptenModuleLoader({
            resolveFrom: import.meta.url,
            moduleFileName: moduleUrl,
            createModuleOptions(moduleUrl) {
                return { moduleUrl };
            },
            normalizeModule(module) {
                return module as { options: { moduleUrl: string } };
            },
            createInitError(error) {
                return error instanceof Error ? error : new Error(String(error));
            },
        });

        const module = await loader.init();

        expect(module.options.moduleUrl).toBe(moduleUrl);
    });
});
