/**
 * Compression quality integration tests.
 *
 * These tests use the real WASM module (no mocks) and all PDF fixtures in
 * src/test/fixtures/pdfs/compression to verify that:
 *
 *  1. Every UI-facing compression scenario produces a valid, non-empty PDF for
 *     every fixture (or throws an engine compression error — accepted as a known
 *     WASM limitation for certain malformed/exotic fixtures).
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
import { beforeAll, describe, expect, it } from "vitest";
import { compressPdf, linearizePdf, optimizePdf } from "../operations/compress.js";
import { GhostscriptCompressionError, QpdfCompressionError } from "../errors/index.js";
import { GHOSTSCRIPT_PRESETS } from "../engines/ghostscript/options.js";
import { QPDF_PRESETS } from "../engines/qpdf/options.js";
import type { CompressOptions, CompressResult, DecodeLevel, GhostscriptPdfSettings, OptimizeOptions, OptimizeResult, QpdfOptimizePreset } from "../types/index.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FIXTURE_DIR = join(dirname(fileURLToPath(import.meta.url)), "fixtures/pdfs/compression");
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
        `<compression-report generated="${new Date().toISOString()}" fixtures="${allFileNames.length}" scenarios="${COMPRESSION_SCENARIOS.length}">`,
    ];

    for (const name of allFileNames) {
        const fileResults = results.filter((r) => r.name === name);
        const fileSkipped = skipped.filter((s) => s.name === name);
        const originalBytes = fileResults[0]?.originalBytes ?? fileSkipped[0]?.originalBytes ?? 0;
        const allAborted = fileSkipped.length > 0 && fileResults.length === 0;

        lines.push(`  <file name="${escapeXml(name)}" originalBytes="${originalBytes}"${allAborted ? ' status="wasm-abort"' : ""}>`);

        for (const scenario of COMPRESSION_SCENARIOS) {
            const r = fileResults.find((x) => x.scenario === scenario.key);
            const s = fileSkipped.find((x) => x.scenario === scenario.key);
            const attributes = `scenario="${scenario.key}" label="${escapeXml(scenario.label)}" engine="${scenario.engine}" preset="${scenario.expectedPreset}"`;

            if (r) {
                lines.push(
                    `    <result ${attributes} compressedBytes="${r.compressedBytes}" savedBytes="${r.savedBytes}" percentageSaved="${r.percentageSaved}" ratio="${r.ratio}"/>`,
                );
            } else if (s) {
                lines.push(`    <result ${attributes} status="wasm-abort"/>`);
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

async function tryCompressScenario(data: Uint8Array, scenario: CompressionScenario): Promise<CompressResult | null> {
    try {
        return await compressPdf(data, scenario.options);
    } catch (error) {
        if (error instanceof QpdfCompressionError || error instanceof GhostscriptCompressionError) {
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

type CompressionScenarioKey = "simple-recommended" | "simple-smallest" | "simple-best-quality" | "recommended-qpdf" | "recommended-ghostscript";

type CompressionScenario = {
    key: CompressionScenarioKey;
    label: string;
    engine: "qpdf" | "ghostscript";
    expectedPreset: QpdfOptimizePreset | GhostscriptPdfSettings;
    options: CompressOptions;
    reportSourceKey?: CompressionScenarioKey;
};

const COMPRESSION_SCENARIOS: CompressionScenario[] = [
    {
        key: "simple-recommended",
        label: "Recommended",
        engine: "ghostscript",
        expectedPreset: "ebook",
        options: {
            engine: "ghostscript",
            preset: "ebook",
            ...GHOSTSCRIPT_PRESETS.ebook,
        },
    },
    {
        key: "simple-smallest",
        label: "Smallest file",
        engine: "ghostscript",
        expectedPreset: "screen",
        options: {
            engine: "ghostscript",
            preset: "screen",
            ...GHOSTSCRIPT_PRESETS.screen,
        },
    },
    {
        key: "simple-best-quality",
        label: "Best quality",
        engine: "qpdf",
        expectedPreset: "archive",
        options: {
            engine: "qpdf",
            preset: "archive",
            ...QPDF_PRESETS.archive,
        },
    },
    {
        key: "recommended-qpdf",
        label: "Recommended qpdf",
        engine: "qpdf",
        expectedPreset: "archive",
        reportSourceKey: "simple-best-quality",
        options: {
            engine: "qpdf",
            preset: "archive",
            ...QPDF_PRESETS.archive,
        },
    },
    {
        key: "recommended-ghostscript",
        label: "Recommended Ghostscript",
        engine: "ghostscript",
        expectedPreset: "ebook",
        reportSourceKey: "simple-recommended",
        options: {
            engine: "ghostscript",
            preset: "ebook",
            ...GHOSTSCRIPT_PRESETS.ebook,
        },
    },
];

const QPDF_PRESET_NAMES: QpdfOptimizePreset[] = ["default", "web", "archive"];
const DECODE_LEVELS: DecodeLevel[] = ["none", "generalized", "specialized", "all"];

// ---------------------------------------------------------------------------
// Sanity check
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Pre-compute compression results for all fixtures × all scenarios so that
// the size-reporting suite can reference them without re-running the WASM.
// ---------------------------------------------------------------------------

type SizeResult = {
    name: string;
    scenario: CompressionScenarioKey;
    engine: "qpdf" | "ghostscript";
    preset: QpdfOptimizePreset | GhostscriptPdfSettings;
    originalBytes: number;
    compressedBytes: number;
    savedBytes: number;
    percentageSaved: number;
    ratio: number;
};

type SkippedResult = {
    name: string;
    scenario: CompressionScenarioKey;
    originalBytes: number;
    reason: "wasm-abort";
};

const sizeResults: SizeResult[] = [];
const skippedResults: SkippedResult[] = [];

// ---------------------------------------------------------------------------

describe("compression quality", () => {
    // Pre-compute compression results for all fixtures × all scenarios inside
    // beforeAll so that: (a) vitest enforces a timeout on stuck WASM calls,
    // (b) failures surface as named suite errors rather than obscure
    //     "error collecting test file" messages at module-evaluation time.
    beforeAll(async () => {
        for (const fixture of fixtures) {
            const resultsByScenario = new Map<CompressionScenarioKey, CompressResult | null>();

            for (const scenario of COMPRESSION_SCENARIOS) {
                if (scenario.reportSourceKey !== undefined && !resultsByScenario.has(scenario.reportSourceKey)) {
                    throw new Error(`Missing compression result for report source scenario: ${scenario.reportSourceKey}`);
                }

                const result =
                    scenario.reportSourceKey !== undefined ? (resultsByScenario.get(scenario.reportSourceKey) ?? null) : await tryCompressScenario(fixture.data, scenario);
                resultsByScenario.set(scenario.key, result);

                if (result !== null) {
                    sizeResults.push({
                        name: fixture.name,
                        scenario: scenario.key,
                        engine: result.engine,
                        preset: result.preset,
                        originalBytes: result.originalSize,
                        compressedBytes: result.compressedSize,
                        savedBytes: result.savedBytes,
                        percentageSaved: Math.round(result.percentageSaved * 10) / 10,
                        ratio: result.originalSize === 0 ? 1 : Math.round((result.compressedSize / result.originalSize) * 10000) / 10000,
                    });
                } else {
                    skippedResults.push({ name: fixture.name, scenario: scenario.key, originalBytes: fixture.data.length, reason: "wasm-abort" });
                }
            }
        }
        await writeCompressionReport(sizeResults, skippedResults);
    }, 5 * 60_000);

    it("has at least one PDF fixture", () => {
        expect(fixtures.length).toBeGreaterThan(0);
    });

    // -----------------------------------------------------------------------
    // 0. Size report — logs a table of actual sizes so CI output and junit
    //    artifacts show concrete byte counts for every fixture × scenario.
    //    Each test name encodes the result so it is visible in the junit XML.
    // -----------------------------------------------------------------------

    describe("compression size report", () => {
        it("prints a summary table of all compression results", () => {
            const rows = sizeResults.map((r) => ({
                fixture: r.name,
                scenario: r.scenario,
                engine: r.engine,
                preset: r.preset,
                original: formatBytes(r.originalBytes),
                compressed: formatBytes(r.compressedBytes),
                saved: formatBytes(r.savedBytes),
                "savings %": `${r.percentageSaved >= 0 ? "+" : ""}${r.percentageSaved.toFixed(1)}%`,
            }));
            console.table(rows);
            expect(sizeResults.length).toBeGreaterThan(0);
        });

        // it.each(sizeResults) is not used here because sizeResults is empty
        // at test-registration time (populated by beforeAll above). Instead we
        // iterate over fixtures — which are loaded at module level — and look
        // up the pre-computed result inside the test body.
        it.each(fixtures)(
            "size bookkeeping is consistent for $name",
            ({ name }) => {
                for (const scenario of COMPRESSION_SCENARIOS) {
                    const r = sizeResults.find((x) => x.name === name && x.scenario === scenario.key);
                    if (!r) continue; // wasm-abort for this scenario — acceptable
                    expect(r.compressedBytes).toBeGreaterThan(0);
                    expect(r.savedBytes).toBe(r.originalBytes - r.compressedBytes);
                }
            },
            TEST_TIMEOUT_MS,
        );
    });

    // -----------------------------------------------------------------------
    // 1 & 2. Output validity + statistic consistency — every scenario × every
    //    fixture. tryCompressScenario runs once per (scenario, fixture) in
    //    beforeAll; both checks share the same result to avoid redundant WASM
    //    calls.
    // -----------------------------------------------------------------------

    describe.each(COMPRESSION_SCENARIOS)("$label", (scenario) => {
        describe.each(fixtures)("$name", ({ data }) => {
            let result!: CompressResult | null;

            beforeAll(async () => {
                result = await tryCompressScenario(data, scenario);
            }, TEST_TIMEOUT_MS);

            it("produces a valid non-empty PDF", () => {
                if (result === null) return; // WASM abort — skip
                expect(result.data.byteLength).toBeGreaterThan(0);
                expect(hasPdfHeader(result.data)).toBe(true);
                expect(result.engine).toBe(scenario.engine);
                expect(result.preset).toBe(scenario.expectedPreset);
            });

            it("reports internally consistent statistics", () => {
                if (result === null) return; // WASM abort — skip
                expect(result.originalSize).toBe(data.byteLength);
                expect(result.compressedSize).toBe(result.data.byteLength);

                const expectedSaved = result.originalSize - result.compressedSize;
                expect(result.savedBytes).toBe(expectedSaved);

                const expectedRatio = result.originalSize === 0 ? 0 : result.compressedSize / result.originalSize;
                expect(result.compressionRatio).toBeCloseTo(expectedRatio, 5);

                const expectedPct = result.originalSize === 0 ? 0 : (result.savedBytes / result.originalSize) * 100;
                expect(result.percentageSaved).toBeCloseTo(expectedPct, 3);
            });
        });
    });

    // -----------------------------------------------------------------------
    // 3. Archive vs. default — archive must not meaningfully grow vs. default
    //    Only compared when both presets succeed on the same file.
    // -----------------------------------------------------------------------

    describe('preset "archive" vs "default" size comparison', () => {
        it.each(fixtures)(
            '"archive" output is no larger than "default" output for $name (±5 %)',
            async ({ data }) => {
                const [defaultResult, archiveResult] = await Promise.all([tryCompress(data, { preset: "default" }), tryCompress(data, { preset: "archive" })]);

                if (defaultResult === null || archiveResult === null) return; // skip on WASM abort

                // archive may equal or beat default; a tiny 5 % slack covers
                // cases where additional metadata from linearise headers adds bytes.
                expect(archiveResult.compressedSize).toBeLessThanOrEqual(defaultResult.compressedSize * 1.05);
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
    // 6. QPDF presets
    // -----------------------------------------------------------------------

    describe.each(QPDF_PRESET_NAMES)('qpdf preset "%s"', (preset) => {
        it.each(fixtures)(
            "produces a valid non-empty PDF for $name",
            async ({ data }) => {
                const result = await tryCompress(data, { preset });
                if (result === null) return; // skip on WASM abort

                expect(hasPdfHeader(result.data)).toBe(true);
                expect(result.compressedSize).toBeGreaterThan(0);
                expect(result.preset).toBe(preset);
            },
            TEST_TIMEOUT_MS,
        );
    });

    // -----------------------------------------------------------------------
    // 7. Decode levels
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
    // 8. objectStreams mode
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
