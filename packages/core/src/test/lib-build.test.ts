/**
 * lib build smoke tests
 *
 * Verifies that the TypeScript bundle produced by `pnpm build:lib` (tsdown)
 * exports the expected public symbols from every subpath entry point.
 *
 * Run after `pnpm build:lib`. If dist/ does not exist yet the whole suite is
 * skipped with a clear message so CI does not fail on a cold build machine.
 */

import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, "../../dist");
const distExists = existsSync(distDir);

describe.skipIf(!distExists)("lib build — dist/ must exist (run build:lib first)", () => {
    it("dist/index.mjs exports root public API", async () => {
        const mod = await import(resolve(distDir, "index.mjs"));
        expect(typeof mod.compressPdf).toBe("function");
        expect(typeof mod.inspectPdf).toBe("function");
        expect(typeof mod.splitPdf).toBe("function");
        expect(typeof mod.mergePdfs).toBe("function");
        expect(typeof mod.organizePdf).toBe("function");
        expect(typeof mod.extractImages).toBe("function");
        expect(typeof mod.getAvailableCompressionEngines).toBe("function");
    });

    it("dist/qpdf.mjs exports qpdf subpath API", async () => {
        const mod = await import(resolve(distDir, "qpdf.mjs"));
        expect(typeof mod.optimizePdf).toBe("function");
        expect(typeof mod.linearizePdf).toBe("function");
        expect(typeof mod.compressPdfWithQpdf).toBe("function");
        expect(typeof mod.initQpdf).toBe("function");
        expect(typeof mod.getQpdfVersion).toBe("function");
        expect(typeof mod.QpdfDocument).toBe("function");
    });

    it("dist/ghostscript.mjs exports ghostscript subpath API", async () => {
        const mod = await import(resolve(distDir, "ghostscript.mjs"));
        expect(typeof mod.compressPdfWithGhostscript).toBe("function");
        expect(typeof mod.rewritePdfWithGhostscript).toBe("function");
        expect(typeof mod.initGhostscript).toBe("function");
        expect(typeof mod.getGhostscriptVersion).toBe("function");
    });

    it("CJS entry points exist alongside ESM", () => {
        expect(existsSync(resolve(distDir, "index.cjs"))).toBe(true);
        expect(existsSync(resolve(distDir, "qpdf.cjs"))).toBe(true);
        expect(existsSync(resolve(distDir, "ghostscript.cjs"))).toBe(true);
    });

    it("declaration files are emitted", () => {
        expect(existsSync(resolve(distDir, "index.d.mts"))).toBe(true);
        expect(existsSync(resolve(distDir, "qpdf.d.mts"))).toBe(true);
        expect(existsSync(resolve(distDir, "ghostscript.d.mts"))).toBe(true);
    });
});
