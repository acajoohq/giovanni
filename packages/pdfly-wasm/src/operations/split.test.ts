import { describe, it, expect, vi, beforeEach } from "vitest";
import { QpdfSplitError } from "../errors/index.js";
import { splitPdf } from "./split.js";
import { initQpdfModule } from "../engines/qpdf/module-loader.js";

vi.mock("../engines/qpdf/module-loader.js");

const mockInitQpdfModule = vi.mocked(initQpdfModule);

function makeFakeModule(splitPages = vi.fn<() => Uint8Array[]>(() => [new Uint8Array([1]), new Uint8Array([2])])) {
    return {
        splitPages,
        compressPdf: () => new Uint8Array(),
        mergePdfs: () => new Uint8Array(),
        extractImages: () => [],
        getVersion: () => "11.0.0",
        QPDFWrapper: function () {},
        QPDFWriter: function () {},
    };
}

beforeEach(() => {
    vi.resetAllMocks();
});

describe("splitPdf", () => {
    it("returns pages and pageCount", async () => {
        mockInitQpdfModule.mockResolvedValue(makeFakeModule() as never);

        const result = await splitPdf(new Uint8Array());

        expect(result.pageCount).toBe(2);
        expect(result.pages).toHaveLength(2);
    });

    it("copies pages out of WASM heap via slice()", async () => {
        const wasmPage = new Uint8Array([1, 2, 3]);
        const sliceSpy = vi.spyOn(wasmPage, "slice");
        mockInitQpdfModule.mockResolvedValue(makeFakeModule(vi.fn<() => Uint8Array[]>(() => [wasmPage])) as never);

        await splitPdf(new Uint8Array());

        expect(sliceSpy).toHaveBeenCalled();
    });

    it("throws QpdfSplitError when splitPages export is missing", async () => {
        const mod = makeFakeModule();
        (mod as { splitPages: unknown }).splitPages = undefined;
        mockInitQpdfModule.mockResolvedValue(mod as never);

        await expect(splitPdf(new Uint8Array())).rejects.toBeInstanceOf(QpdfSplitError);
    });

    it("wraps unexpected errors in QpdfSplitError", async () => {
        mockInitQpdfModule.mockRejectedValue(new Error("WASM crash"));

        await expect(splitPdf(new Uint8Array())).rejects.toBeInstanceOf(QpdfSplitError);
        await expect(splitPdf(new Uint8Array())).rejects.toThrow("Failed to split PDF");
    });

    it("accepts ArrayBuffer input", async () => {
        mockInitQpdfModule.mockResolvedValue(makeFakeModule(vi.fn<() => Uint8Array[]>(() => [new Uint8Array([1])])) as never);

        const result = await splitPdf(new ArrayBuffer(4));

        expect(result.pageCount).toBe(1);
    });
});
