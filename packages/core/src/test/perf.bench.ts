/**
 * Local performance benchmarks.
 *
 * Real WASM (no mocks), same fixtures as compression-quality.test.ts. These
 * are NOT wired into CI: shared CI runners are too noisy (variable
 * neighbour load) to produce a reliable pass/fail signal on wall-clock time.
 *
 * Usage: run once on your baseline, then again after a change, on the same
 * machine in the same session, and compare the printed mean/median:
 *
 *   pnpm bench
 *
 * See https://vitest.dev/guide/features.html#benchmarking for the tinybench
 * options (iterations, warmup, etc.) accepted as the third `bench()` arg.
 */

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { bench, describe } from "vitest";
import { compressPdf } from "../operations/compress.js";
import { extractImages } from "../operations/extract-images.js";
import { mergePdfs } from "../operations/merge.js";
import { splitPdf } from "../operations/split.js";
import { watermarkPdf } from "../operations/watermark.js";
import { GHOSTSCRIPT_PRESETS } from "../engines/ghostscript/options.js";
import { QPDF_PRESETS } from "../engines/qpdf/options.js";

const FIXTURE_DIR = join(dirname(fileURLToPath(import.meta.url)), "fixtures/pdfs/compression");

// Larger of the two compression fixtures — small samples make the WASM
// call overhead dominate the signal instead of the work being measured.
const imagePdf = new Uint8Array(await readFile(join(FIXTURE_DIR, "single-page-image.pdf")));
const textPdf = new Uint8Array(await readFile(join(FIXTURE_DIR, "single-page-text.pdf")));

// Keep runs short and predictable: fixed iteration count rather than
// tinybench's default time-based budget, so total suite runtime doesn't
// balloon on the (slow) ghostscript/combined cases.
const BENCH_OPTIONS = { iterations: 5, warmupIterations: 1 };

describe("qpdf", () => {
    bench(
        "compress (default preset)",
        async () => {
            await compressPdf(imagePdf, { engine: "qpdf", preset: "default", ...QPDF_PRESETS.default });
        },
        BENCH_OPTIONS,
    );

    bench(
        "compress (archive preset)",
        async () => {
            await compressPdf(imagePdf, { engine: "qpdf", preset: "archive", ...QPDF_PRESETS.archive });
        },
        BENCH_OPTIONS,
    );

    bench(
        "split",
        async () => {
            await splitPdf(imagePdf);
        },
        BENCH_OPTIONS,
    );

    bench(
        "merge (2 files)",
        async () => {
            await mergePdfs([imagePdf, textPdf]);
        },
        BENCH_OPTIONS,
    );

    bench(
        "watermark",
        async () => {
            await watermarkPdf(imagePdf, { watermark: textPdf });
        },
        BENCH_OPTIONS,
    );

    bench(
        "extract images",
        async () => {
            await extractImages(imagePdf);
        },
        BENCH_OPTIONS,
    );
});

describe("ghostscript", () => {
    bench(
        "compress (ebook preset)",
        async () => {
            await compressPdf(imagePdf, { engine: "ghostscript", preset: "ebook", ...GHOSTSCRIPT_PRESETS.ebook });
        },
        BENCH_OPTIONS,
    );

    bench(
        "compress (screen preset)",
        async () => {
            await compressPdf(imagePdf, { engine: "ghostscript", preset: "screen", ...GHOSTSCRIPT_PRESETS.screen });
        },
        BENCH_OPTIONS,
    );
});

describe("combined", () => {
    bench(
        "compress (balanced)",
        async () => {
            await compressPdf(imagePdf, {
                engine: "combined",
                ghostscript: { preset: "ebook", ...GHOSTSCRIPT_PRESETS.ebook },
                qpdf: { preset: "archive", ...QPDF_PRESETS.archive },
            });
        },
        BENCH_OPTIONS,
    );
});
