import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { compressPdf, splitPages } from "@pdfly/wasm";
import { describe, expect, it } from "vitest";

type PdfFixture = {
    data: Uint8Array;
    maxCompressedSize?: number;
    name: string;
};

const compressionGoalsByFileName: Record<string, number> = {
    "De_Kempenaerstraat_22_1.pdf": 13_750_000,
    "Testing sellplus slide auto fill.pdf": 3_050_000,
};
const fixtureDirectory = join(dirname(fileURLToPath(import.meta.url)), "test/fixtures/pdfs");
const pdfFixtures = await loadPdfFixtures();
const pdfFixturesWithCompressionGoals = pdfFixtures.filter((fixture): fixture is PdfFixture & { maxCompressedSize: number } => fixture.maxCompressedSize !== undefined);
const integrationTestTimeoutMs = 60_000;

describe("pdf tools", () => {
    it("has PDF fixtures", () => {
        expect(pdfFixtures.length).toBeGreaterThan(0);
    });

    it.each(pdfFixtures)(
        "compresses $name into a readable PDF",
        async ({ data }) => {
            const result = await compressPdf(data);

            expect(result.originalSize).toBe(data.byteLength);
            expect(result.compressedSize).toBe(result.data.byteLength);
            expect(result.data.byteLength).toBeGreaterThan(0);
            expect(hasPdfHeader(result.data)).toBe(true);
        },
        integrationTestTimeoutMs,
    );

    it.each(pdfFixturesWithCompressionGoals)(
        "keeps $name under the compression goal",
        async ({ data, maxCompressedSize }) => {
            const result = await compressPdf(data);

            expect(result.compressedSize).toBeLessThanOrEqual(maxCompressedSize);
        },
        integrationTestTimeoutMs,
    );

    it.each(pdfFixtures)(
        "splits $name into readable page PDFs",
        async ({ data }) => {
            const result = await splitPages(data);

            expect(result.pageCount).toBeGreaterThan(0);
            expect(result.pages).toHaveLength(result.pageCount);

            for (const page of result.pages) {
                expect(page.byteLength).toBeGreaterThan(0);
                expect(hasPdfHeader(page)).toBe(true);
            }
        },
        integrationTestTimeoutMs,
    );
});

async function loadPdfFixtures(): Promise<PdfFixture[]> {
    try {
        const entries = await readdir(fixtureDirectory, { withFileTypes: true });
        const pdfEntries = entries.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".pdf")).sort((first, second) => first.name.localeCompare(second.name));

        return Promise.all(
            pdfEntries.map(async (entry) => ({
                data: new Uint8Array(await readFile(join(fixtureDirectory, entry.name))),
                maxCompressedSize: compressionGoalsByFileName[entry.name],
                name: entry.name,
            })),
        );
    } catch (error) {
        if (isNodeError(error) && error.code === "ENOENT") {
            return [];
        }
        throw error;
    }
}

function isNodeError(error: unknown): error is Error & { code: string } {
    return error instanceof Error && "code" in error;
}

function hasPdfHeader(data: Uint8Array): boolean {
    return new TextDecoder().decode(data.slice(0, 5)) === "%PDF-";
}
