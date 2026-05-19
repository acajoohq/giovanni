import { describe, expect, it, vi, beforeEach } from "vitest";
import { QpdfOrganizeError } from "../errors/index.js";
import { organizePdf } from "./organize.js";
import { splitPdf } from "./split.js";
import { mergePdfs } from "./merge.js";

vi.mock("./split.js");
vi.mock("./merge.js");

const mockSplitPdf = vi.mocked(splitPdf);
const mockMergePdfs = vi.mocked(mergePdfs);

function makeSplitResult(pageCount: number) {
    const pages = Array.from({ length: pageCount }, (_, i) => new Uint8Array([i]));
    return { pages, pageCount };
}

function makeMergeResult(data = new Uint8Array([0x25, 0x50, 0x44, 0x46])) {
    return { data, sourceCount: 1 };
}

beforeEach(() => {
    vi.resetAllMocks();
});

describe("organizePdf", () => {
    it("throws QpdfOrganizeError when pages is empty", async () => {
        await expect(organizePdf(new Uint8Array(), { pages: [] })).rejects.toBeInstanceOf(QpdfOrganizeError);
        await expect(organizePdf(new Uint8Array(), { pages: [] })).rejects.toThrow("pages must contain at least one page index");
    });

    it("selects a single page from a multi-page PDF", async () => {
        mockSplitPdf.mockResolvedValue(makeSplitResult(3));
        mockMergePdfs.mockResolvedValue(makeMergeResult());

        const { pageCount, originalPageCount } = await organizePdf(new Uint8Array(), { pages: [1] });

        expect(pageCount).toBe(1);
        expect(originalPageCount).toBe(3);
    });

    it("passes pages to mergePdfs in the specified order", async () => {
        const pages = [new Uint8Array([0]), new Uint8Array([1]), new Uint8Array([2])];
        mockSplitPdf.mockResolvedValue({ pages, pageCount: 3 });
        mockMergePdfs.mockResolvedValue(makeMergeResult());

        await organizePdf(new Uint8Array(), { pages: [2, 0, 1] });

        expect(mockMergePdfs).toHaveBeenCalledWith([pages[2], pages[0], pages[1]]);
    });

    it("allows duplicate page indices", async () => {
        mockSplitPdf.mockResolvedValue(makeSplitResult(3));
        mockMergePdfs.mockResolvedValue(makeMergeResult());

        const { pageCount, originalPageCount } = await organizePdf(new Uint8Array(), { pages: [0, 0, 0] });

        expect(pageCount).toBe(3);
        expect(originalPageCount).toBe(3);
    });

    it("removes pages by omitting their index", async () => {
        mockSplitPdf.mockResolvedValue(makeSplitResult(3));
        mockMergePdfs.mockResolvedValue(makeMergeResult());

        const { pageCount, originalPageCount } = await organizePdf(new Uint8Array(), { pages: [0, 2] });

        expect(pageCount).toBe(2);
        expect(originalPageCount).toBe(3);
    });

    it("accepts ArrayBuffer input", async () => {
        mockSplitPdf.mockResolvedValue(makeSplitResult(2));
        mockMergePdfs.mockResolvedValue(makeMergeResult());

        const { pageCount } = await organizePdf(new ArrayBuffer(4), { pages: [0] });

        expect(pageCount).toBe(1);
    });

    it("returns the data from mergePdfs", async () => {
        const expectedData = new Uint8Array([1, 2, 3, 4]);
        mockSplitPdf.mockResolvedValue(makeSplitResult(1));
        mockMergePdfs.mockResolvedValue({ data: expectedData, sourceCount: 1 });

        const { data } = await organizePdf(new Uint8Array(), { pages: [0] });

        expect(data).toBe(expectedData);
    });

    it("throws QpdfOrganizeError for an out-of-bounds index", async () => {
        mockSplitPdf.mockResolvedValue(makeSplitResult(3));

        await expect(organizePdf(new Uint8Array(), { pages: [3] })).rejects.toBeInstanceOf(QpdfOrganizeError);
        await expect(organizePdf(new Uint8Array(), { pages: [3] })).rejects.toThrow("Invalid page index 3");
    });

    it("throws QpdfOrganizeError for a negative index", async () => {
        mockSplitPdf.mockResolvedValue(makeSplitResult(3));

        await expect(organizePdf(new Uint8Array(), { pages: [-1] })).rejects.toBeInstanceOf(QpdfOrganizeError);
        await expect(organizePdf(new Uint8Array(), { pages: [-1] })).rejects.toThrow("Invalid page index -1");
    });

    it("throws QpdfOrganizeError for a non-integer index", async () => {
        mockSplitPdf.mockResolvedValue(makeSplitResult(3));

        await expect(organizePdf(new Uint8Array(), { pages: [0.5] })).rejects.toBeInstanceOf(QpdfOrganizeError);
        await expect(organizePdf(new Uint8Array(), { pages: [0.5] })).rejects.toThrow("Invalid page index 0.5");
    });

    it("wraps unexpected errors in QpdfOrganizeError", async () => {
        mockSplitPdf.mockRejectedValue(new Error("unexpected WASM crash"));

        const promise = organizePdf(new Uint8Array(), { pages: [0] });

        await expect(promise).rejects.toBeInstanceOf(QpdfOrganizeError);
        await expect(promise).rejects.toThrow("Failed to reorganize PDF pages");
    });
});
