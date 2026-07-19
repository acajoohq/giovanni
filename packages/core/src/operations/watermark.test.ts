import { beforeEach, describe, expect, it, vi } from "vitest";
import { QpdfWatermarkError } from "../errors/index.js";
import { watermarkPdf } from "./watermark.js";

const mockBinding = {
    getDocumentInfo: vi.fn<(data: Uint8Array, password?: string) => Promise<{ numPages: number }>>(),
    watermarkPdf:
        vi.fn<(data: Uint8Array, watermark: Uint8Array, options: { underlay: boolean; pages: number[] }, password?: string, watermarkPassword?: string) => Promise<Uint8Array>>(),
};

vi.mock("../bindings/index.js", () => ({
    getQpdfBinding: () => mockBinding,
}));

beforeEach(() => {
    vi.resetAllMocks();
});

describe("watermarkPdf", () => {
    it("applies overlay watermark to all pages by default", async () => {
        mockBinding.getDocumentInfo.mockResolvedValueOnce({ numPages: 3 }).mockResolvedValueOnce({ numPages: 1 });
        mockBinding.watermarkPdf.mockResolvedValue(new Uint8Array([1, 2, 3]));

        const result = await watermarkPdf(new Uint8Array([10]), { watermark: new Uint8Array([20]) });

        expect(result.pageCount).toBe(3);
        expect(result.watermarkedPageCount).toBe(3);
        expect(result.placement).toBe("overlay");
        expect(mockBinding.watermarkPdf).toHaveBeenCalledWith(expect.any(Uint8Array), expect.any(Uint8Array), { underlay: false, pages: [] }, undefined, undefined);
    });

    it("applies underlay watermark to selected pages", async () => {
        mockBinding.getDocumentInfo.mockResolvedValueOnce({ numPages: 5 }).mockResolvedValueOnce({ numPages: 1 });
        mockBinding.watermarkPdf.mockResolvedValue(new Uint8Array([4, 5, 6]));

        const result = await watermarkPdf(new Uint8Array([10]), { watermark: new Uint8Array([20]), placement: "underlay", pages: [1, 3] });

        expect(result.watermarkedPageCount).toBe(2);
        expect(result.placement).toBe("underlay");
        expect(mockBinding.watermarkPdf).toHaveBeenCalledWith(expect.any(Uint8Array), expect.any(Uint8Array), { underlay: true, pages: [1, 3] }, undefined, undefined);
    });

    it("rejects empty explicit page selection", async () => {
        mockBinding.getDocumentInfo.mockResolvedValueOnce({ numPages: 3 }).mockResolvedValueOnce({ numPages: 1 });

        const promise = watermarkPdf(new Uint8Array([10]), { watermark: new Uint8Array([20]), pages: [] });

        await expect(promise).rejects.toBeInstanceOf(QpdfWatermarkError);
        await expect(promise).rejects.toThrow("pages must contain at least one page index");
    });

    it("rejects invalid page indices", async () => {
        mockBinding.getDocumentInfo.mockResolvedValueOnce({ numPages: 2 }).mockResolvedValueOnce({ numPages: 1 });

        const promise = watermarkPdf(new Uint8Array([10]), { watermark: new Uint8Array([20]), pages: [2] });

        await expect(promise).rejects.toBeInstanceOf(QpdfWatermarkError);
        await expect(promise).rejects.toThrow("Invalid page index 2");
    });

    it("rejects duplicate page indices", async () => {
        mockBinding.getDocumentInfo.mockResolvedValueOnce({ numPages: 4 }).mockResolvedValueOnce({ numPages: 1 });

        const promise = watermarkPdf(new Uint8Array([10]), { watermark: new Uint8Array([20]), pages: [1, 1] });

        await expect(promise).rejects.toBeInstanceOf(QpdfWatermarkError);
        await expect(promise).rejects.toThrow("Duplicate page index 1");
    });
});
