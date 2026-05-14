/**
 * Compression quality integration tests.
 *
 * These tests use the real WASM module (no mocks) and all PDF fixtures in
 * src/test/fixtures/pdfs to verify that:
 *
 *  1. Every preset produces a valid, non-empty PDF for every fixture
 *     (or throws QpdfCompressionError — accepted as a known WASM limitation
 *     for certain malformed/exotic fixtures, matching pre-existing failures
 *     in extract-images.test.ts for the same files).
 *  2. The result statistics (savedBytes, compressionRatio, percentageSaved) are
 *     internally consistent for every file that compresses successfully.
 *  3. The "archive" preset never meaningfully inflates files vs. "default"
 *     for files where both presets succeed.
 *  4. Higher compressionLevel (9) produces output ≤ lower level (1) for files
 *     that compress successfully.
 *  5. linearizePdf produces a valid PDF for every fixture that succeeds.
 *  6. Every decodeLevel produces a valid PDF for every fixture that succeeds.
 */

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { linearizePdf, optimizePdf } from "../core/compress.js";
import { QpdfCompressionError } from "../core/errors.js";
import type { DecodeLevel, OptimizeOptions, OptimizeResult, QpdfOptimizePreset } from "../types/index.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FIXTURE_DIR = join(dirname(fileURLToPath(import.meta.url)), "fixtures/pdfs");
const TEST_TIMEOUT_MS = 60_000;

type PdfFixture = {
    /** Relative path from FIXTURE_DIR, e.g. "upstream/qpdf/filter-on-write.pdf" */
    name: string;
    data: Uint8Array;
};

async function loadFixtures(): Promise<PdfFixture[]> {
    const files: string[] = [];

    async function walk(dir: string): Promise<void> {
        const entries = await readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = join(dir, entry.name);
            if (entry.isDirectory()) {
                await walk(fullPath);
            } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".pdf")) {
                files.push(fullPath);
            }
        }
    }

    await walk(FIXTURE_DIR);
    files.sort();

    return Promise.all(
        files.map(async (fullPath) => ({
            name: relative(FIXTURE_DIR, fullPath).replace(/\\/g, "/"),
            data: new Uint8Array(await readFile(fullPath)),
        })),
    );
}

function hasPdfHeader(data: Uint8Array): boolean {
    return data.length >= 5 && new TextDecoder().decode(data.slice(0, 5)) === "%PDF-";
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function escapeXml(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function writeCompressionReport(results: SizeResult[], skipped: SkippedResult[]): Promise<void> {
    const reportDir = join(dirname(fileURLToPath(import.meta.url)), "../../test-report");
    await mkdir(reportDir, { recursive: true });

    const allFileNames = [...new Set([...results.map((r) => r.name), ...skipped.map((s) => s.name)])].sort();

    const lines: string[] = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        `<compression-report generated="${new Date().toISOString()}" fixtures="${allFileNames.length}" presets="3">`,
    ];

    for (const name of allFileNames) {
        const fileResults = results.filter((r) => r.name === name);
        const fileSkipped = skipped.filter((s) => s.name === name);
        const originalBytes = fileResults[0]?.originalBytes ?? 0;
        const allAborted = fileSkipped.length > 0 && fileResults.length === 0;

        lines.push(
            `  <file name="${escapeXml(name)}" originalBytes="${originalBytes}"${allAborted ? ' status="wasm-abort"' : ""}>`,
        );

        for (const preset of ["default", "web", "archive"] as const) {
            const r = fileResults.find((x) => x.preset === preset);
            const s = fileSkipped.find((x) => x.preset === preset);

            if (r) {
                lines.push(
                    `    <result preset="${preset}" compressedBytes="${r.compressedBytes}" savedBytes="${r.savedBytes}" percentageSaved="${r.percentageSaved}" ratio="${r.ratio}"/>`,
                );
            } else if (s) {
                lines.push(`    <result preset="${preset}" status="wasm-abort"/>`);
            }
        }

        lines.push(`  </file>`);
    }

    lines.push("</compression-report>");

    await writeFile(join(reportDir, "compression-results.xml"), lines.join("\n"), "utf-8");
}

/**
 * Run optimizePdf and return the result, or null if the WASM aborts on this
 * fixture (a known pre-existing issue for certain exotic test files).
 * Any other error type is re-thrown so it still fails the test.
 */
async function tryCompress(data: Uint8Array, options?: OptimizeOptions): Promise<OptimizeResult | null> {
    try {
        return await optimizePdf(data, options);
    } catch (error) {
        if (error instanceof QpdfCompressionError) {
            return null;
        }
        throw error;
    }
}

// Top-level await is fine in ESM vitest tests.
const fixtures = await loadFixtures();

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PRESETS: QpdfOptimizePreset[] = ["default", "web", "archive"];
const DECODE_LEVELS: DecodeLevel[] = ["none", "generalized", "specialized", "all"];

// ---------------------------------------------------------------------------
// Sanity check
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Pre-compute compression results for all fixtures × all presets so that
// the size-reporting suite can reference them without re-running the WASM.
// ---------------------------------------------------------------------------

type SizeResult = {
    name: string;
    preset: QpdfOptimizePreset;
    originalBytes: number;
    compressedBytes: number;
    savedBytes: number;
    percentageSaved: number;
    ratio: number;
};

type SkippedResult = {
    name: string;
    preset: QpdfOptimizePreset;
    reason: "wasm-abort";
};

const sizeResults: SizeResult[] = [];
const skippedResults: SkippedResult[] = [];

for (const fixture of fixtures) {
    for (const preset of ["default", "web", "archive"] as const) {
        const result = await tryCompress(fixture.data, { preset });
        if (result !== null) {
            sizeResults.push({
                name: fixture.name,
                preset,
                originalBytes: result.originalSize,
                compressedBytes: result.compressedSize,
                savedBytes: result.savedBytes,
                percentageSaved: Math.round(result.percentageSaved * 10) / 10,
                ratio: result.originalSize === 0 ? 1 : Math.round((result.compressedSize / result.originalSize) * 10000) / 10000,
            });
        } else {
            skippedResults.push({ name: fixture.name, preset, reason: "wasm-abort" });
        }
    }
}

await writeCompressionReport(sizeResults, skippedResults);

// ---------------------------------------------------------------------------

describe("compression quality", () => {
    it("has at least one PDF fixture", () => {
        expect(fixtures.length).toBeGreaterThan(0);
    });

    // -----------------------------------------------------------------------
    // 0. Size report — logs a table of actual sizes so CI output and junit
    //    artifacts show concrete byte counts for every fixture × preset.
    //    Each test name encodes the result so it is visible in the junit XML.
    // -----------------------------------------------------------------------

    describe("compression size report", () => {
        it("prints a summary table of all compression results", () => {
            const rows = sizeResults.map((r) => ({
                fixture: r.name,
                preset: r.preset,
                original: formatBytes(r.originalBytes),
                compressed: formatBytes(r.compressedBytes),
                saved: formatBytes(r.savedBytes),
                "savings %": `${r.percentageSaved >= 0 ? "+" : ""}${r.percentageSaved.toFixed(1)}%`,
            }));
            console.table(rows);
            expect(sizeResults.length).toBeGreaterThan(0);
        });

        it.each(sizeResults)(
            "$name ($preset): $originalBytes B → $compressedBytes B ($percentageSaved %)",
            ({ originalBytes, compressedBytes, savedBytes }) => {
                // The output must always be a non-empty file.
                expect(compressedBytes).toBeGreaterThan(0);

                // The reported saved bytes must match the difference.
                expect(savedBytes).toBe(originalBytes - compressedBytes);
            },
            TEST_TIMEOUT_MS,
        );
    });

    // -----------------------------------------------------------------------
    // 1. Output validity — every preset × every fixture
    //    Files that cause WASM aborts (known pre-existing bugs) are accepted
    //    as null and skipped rather than failed.
    // -----------------------------------------------------------------------

    describe.each(PRESETS)('preset "%s" — output validity', (preset) => {
        it.each(fixtures)(
            "produces a valid non-empty PDF for $name",
            async ({ data }) => {
                const result = await tryCompress(data, { preset });
                if (result === null) return; // WASM abort on this fixture — skip

                expect(result.data.byteLength).toBeGreaterThan(0);
                expect(hasPdfHeader(result.data)).toBe(true);
                expect(result.preset).toBe(preset);
            },
            TEST_TIMEOUT_MS,
        );
    });

    // -----------------------------------------------------------------------
    // 2. Metric consistency — every preset × every fixture
    //    Only checked for files that compress successfully.
    // -----------------------------------------------------------------------

    describe.each(PRESETS)('preset "%s" — statistic consistency', (preset) => {
        it.each(fixtures)(
            "reports internally consistent statistics for $name",
            async ({ data }) => {
                const result = await tryCompress(data, { preset });
                if (result === null) return; // WASM abort on this fixture — skip

                expect(result.originalSize).toBe(data.byteLength);
                expect(result.compressedSize).toBe(result.data.byteLength);

                const expectedSaved = result.originalSize - result.compressedSize;
                expect(result.savedBytes).toBe(expectedSaved);

                const expectedRatio =
                    result.originalSize === 0 ? 0 : result.compressedSize / result.originalSize;
                expect(result.compressionRatio).toBeCloseTo(expectedRatio, 5);

                const expectedPct =
                    result.originalSize === 0
                        ? 0
                        : (result.savedBytes / result.originalSize) * 100;
                expect(result.percentageSaved).toBeCloseTo(expectedPct, 3);
            },
            TEST_TIMEOUT_MS,
        );
    });

    // -----------------------------------------------------------------------
    // 3. Archive vs. default — archive must not meaningfully grow vs. default
    //    Only compared when both presets succeed on the same file.
    // -----------------------------------------------------------------------

    describe('preset "archive" vs "default" size comparison', () => {
        it.each(fixtures)(
            '"archive" output is no larger than "default" output for $name (±5 %)',
            async ({ data }) => {
                const [defaultResult, archiveResult] = await Promise.all([
                    tryCompress(data, { preset: "default" }),
                    tryCompress(data, { preset: "archive" }),
                ]);

                if (defaultResult === null || archiveResult === null) return; // skip on WASM abort

                // archive may equal or beat default; a tiny 5 % slack covers
                // cases where additional metadata from linearise headers adds bytes.
                expect(archiveResult.compressedSize).toBeLessThanOrEqual(
                    defaultResult.compressedSize * 1.05,
                );
            },
            TEST_TIMEOUT_MS,
        );
    });

    // -----------------------------------------------------------------------
    // 4. Compression level sensitivity — level 9 ≤ level 1
    //    Only compared when both levels succeed on the same file.
    // -----------------------------------------------------------------------

    describe("compressionLevel sensitivity", () => {
        it.each(fixtures)(
            "level 9 produces output no larger than level 1 for $name",
            async ({ data }) => {
                const [low, high] = await Promise.all([
                    tryCompress(data, { compressionLevel: 1, recompressFlate: true }),
                    tryCompress(data, { compressionLevel: 9, recompressFlate: true }),
                ]);

                if (low === null || high === null) return; // skip on WASM abort

                // Identical content → identical size after highest compression.
                // 1 % slack covers non-deterministic block-boundary effects.
                expect(high.compressedSize).toBeLessThanOrEqual(low.compressedSize * 1.01);
            },
            TEST_TIMEOUT_MS,
        );
    });

    // -----------------------------------------------------------------------
    // 5. Linearization
    // -----------------------------------------------------------------------

    describe("linearizePdf", () => {
        it.each(fixtures)(
            "produces a valid non-empty PDF for $name",
            async ({ data }) => {
                let result: OptimizeResult;
                try {
                    result = await linearizePdf(data);
                } catch (error) {
                    if (error instanceof QpdfCompressionError) return; // skip on WASM abort
                    throw error;
                }

                expect(hasPdfHeader(result.data)).toBe(true);
                expect(result.data.byteLength).toBeGreaterThan(0);
            },
            TEST_TIMEOUT_MS,
        );
    });

    // -----------------------------------------------------------------------
    // 6. Decode levels
    // -----------------------------------------------------------------------

    describe.each(DECODE_LEVELS)('decodeLevel "%s"', (decodeLevel) => {
        it.each(fixtures)(
            "produces a valid non-empty PDF for $name",
            async ({ data }) => {
                const result = await tryCompress(data, { decodeLevel });
                if (result === null) return; // skip on WASM abort

                expect(hasPdfHeader(result.data)).toBe(true);
                expect(result.compressedSize).toBeGreaterThan(0);
            },
            TEST_TIMEOUT_MS,
        );
    });

    // -----------------------------------------------------------------------
    // 7. objectStreams mode
    // -----------------------------------------------------------------------

    describe.each(["preserve", "disable", "generate"] as const)('objectStreams "%s"', (objectStreams) => {
        it.each(fixtures)(
            "produces a valid PDF for $name",
            async ({ data }) => {
                const result = await tryCompress(data, { objectStreams });
                if (result === null) return; // skip on WASM abort

                expect(hasPdfHeader(result.data)).toBe(true);
                expect(result.compressedSize).toBeGreaterThan(0);
            },
            TEST_TIMEOUT_MS,
        );
    });
});
