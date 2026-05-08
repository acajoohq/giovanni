import { describe, expect, it, vi, beforeEach } from "vitest";
import { QpdfOrganizeError } from "./errors.js";
import { reorganizePages } from "./organize.js";
import { splitPages } from "./split.js";
import { mergePdfs } from "./merge.js";

vi.mock("./split.js");
vi.mock("./merge.js");

const mockSplitPages = vi.mocked(splitPages);
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

describe("reorganizePages", () => {
    it("throws QpdfOrganizeError when pageOrder is empty", async () => {
        await expect(reorganizePages(new Uint8Array(), [])).rejects.toBeInstanceOf(QpdfOrganizeError);
        await expect(reorganizePages(new Uint8Array(), [])).rejects.toThrow("pageOrder must contain at least one page index");
    });

    it("selects a single page from a multi-page PDF", async () => {
        mockSplitPages.mockResolvedValue(makeSplitResult(3));
        mockMergePdfs.mockResolvedValue(makeMergeResult());

        const { pageCount, originalPageCount } = await reorganizePages(new Uint8Array(), [1]);

        expect(pageCount).toBe(1);
        expect(originalPageCount).toBe(3);
    });

    it("passes pages to mergePdfs in the specified order", async () => {
        const pages = [new Uint8Array([0]), new Uint8Array([1]), new Uint8Array([2])];
        mockSplitPages.mockResolvedValue({ pages, pageCount: 3 });
        mockMergePdfs.mockResolvedValue(makeMergeResult());

        await reorganizePages(new Uint8Array(), [2, 0, 1]);

        expect(mockMergePdfs).toHaveBeenCalledWith([pages[2], pages[0], pages[1]]);
    });

    it("allows duplicate page indices", async () => {
        mockSplitPages.mockResolvedValue(makeSplitResult(3));
        mockMergePdfs.mockResolvedValue(makeMergeResult());

        const { pageCount, originalPageCount } = await reorganizePages(new Uint8Array(), [0, 0, 0]);

        expect(pageCount).toBe(3);
        expect(originalPageCount).toBe(3);
    });

    it("removes pages by omitting their index", async () => {
        mockSplitPages.mockResolvedValue(makeSplitResult(3));
        mockMergePdfs.mockResolvedValue(makeMergeResult());

        const { pageCount, originalPageCount } = await reorganizePages(new Uint8Array(), [0, 2]);

        expect(pageCount).toBe(2);
        expect(originalPageCount).toBe(3);
    });

    it("accepts ArrayBuffer input", async () => {
        mockSplitPages.mockResolvedValue(makeSplitResult(2));
        mockMergePdfs.mockResolvedValue(makeMergeResult());

        const { pageCount } = await reorganizePages(new ArrayBuffer(4), [0]);

        expect(pageCount).toBe(1);
    });

    it("returns the data from mergePdfs", async () => {
        const expectedData = new Uint8Array([1, 2, 3, 4]);
        mockSplitPages.mockResolvedValue(makeSplitResult(1));
        mockMergePdfs.mockResolvedValue({ data: expectedData, sourceCount: 1 });

        const { data } = await reorganizePages(new Uint8Array(), [0]);

        expect(data).toBe(expectedData);
    });

    it("throws QpdfOrganizeError for an out-of-bounds index", async () => {
        mockSplitPages.mockResolvedValue(makeSplitResult(3));

        await expect(reorganizePages(new Uint8Array(), [3])).rejects.toBeInstanceOf(QpdfOrganizeError);
        await expect(reorganizePages(new Uint8Array(), [3])).rejects.toThrow("Invalid page index 3");
    });

    it("throws QpdfOrganizeError for a negative index", async () => {
        mockSplitPages.mockResolvedValue(makeSplitResult(3));

        await expect(reorganizePages(new Uint8Array(), [-1])).rejects.toBeInstanceOf(QpdfOrganizeError);
        await expect(reorganizePages(new Uint8Array(), [-1])).rejects.toThrow("Invalid page index -1");
    });

    it("throws QpdfOrganizeError for a non-integer index", async () => {
        mockSplitPages.mockResolvedValue(makeSplitResult(3));

        await expect(reorganizePages(new Uint8Array(), [0.5])).rejects.toBeInstanceOf(QpdfOrganizeError);
        await expect(reorganizePages(new Uint8Array(), [0.5])).rejects.toThrow("Invalid page index 0.5");
    });

    it("wraps unexpected errors in QpdfOrganizeError", async () => {
        mockSplitPages.mockRejectedValue(new Error("unexpected WASM crash"));

        const promise = reorganizePages(new Uint8Array(), [0]);

        await expect(promise).rejects.toBeInstanceOf(QpdfOrganizeError);
        await expect(promise).rejects.toThrow("Failed to reorganize PDF pages");
    });
});
