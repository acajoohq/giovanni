import { describe, it, expect, vi, beforeEach } from "vitest";
import { QpdfMergeError } from "./errors.js";
import { mergePdfs } from "./merge.js";
import { initQpdfModule } from "./qpdf/module-loader.js";

vi.mock("./qpdf/module-loader.js");

const mockInitQpdfModule = vi.mocked(initQpdfModule);

function makeFakeModule(mergeResult = new Uint8Array([0x25, 0x50, 0x44, 0x46])) {
    return {
        mergePdfs: vi.fn<() => Uint8Array>(() => mergeResult),
        splitPages: () => [] as Uint8Array[],
        compressPdf: () => new Uint8Array(),
        extractImages: () => [],
        getVersion: () => "11.0.0",
        QPDFWrapper: function () {},
        QPDFWriter: function () {},
    };
}

beforeEach(() => {
    vi.resetAllMocks();
});

describe("mergePdfs", () => {
    it("throws QpdfMergeError when called with an empty array", async () => {
        await expect(mergePdfs([])).rejects.toBeInstanceOf(QpdfMergeError);
        await expect(mergePdfs([])).rejects.toThrow("At least one PDF");
    });

    it("merges a single input and returns data with sourceCount", async () => {
        mockInitQpdfModule.mockResolvedValue(makeFakeModule() as never);

        const result = await mergePdfs([new Uint8Array([1, 2, 3])]);

        expect(result.sourceCount).toBe(1);
        expect(result.data).toBeInstanceOf(Uint8Array);
    });

    it("reports the correct sourceCount for multiple inputs", async () => {
        mockInitQpdfModule.mockResolvedValue(makeFakeModule() as never);

        const result = await mergePdfs([new Uint8Array(), new Uint8Array(), new Uint8Array()]);

        expect(result.sourceCount).toBe(3);
    });

    it("copies output out of WASM heap via slice()", async () => {
        const wasmBuffer = new Uint8Array([1, 2, 3]);
        const sliceSpy = vi.spyOn(wasmBuffer, "slice");
        mockInitQpdfModule.mockResolvedValue(makeFakeModule(wasmBuffer) as never);

        await mergePdfs([new Uint8Array()]);

        expect(sliceSpy).toHaveBeenCalled();
    });

    it("throws QpdfMergeError when mergePdfs export is missing", async () => {
        const mod = makeFakeModule();
        (mod as { mergePdfs: unknown }).mergePdfs = undefined;
        mockInitQpdfModule.mockResolvedValue(mod as never);

        await expect(mergePdfs([new Uint8Array()])).rejects.toBeInstanceOf(QpdfMergeError);
    });

    it("wraps unexpected errors in QpdfMergeError", async () => {
        mockInitQpdfModule.mockRejectedValue(new Error("WASM crash"));

        await expect(mergePdfs([new Uint8Array()])).rejects.toBeInstanceOf(QpdfMergeError);
        await expect(mergePdfs([new Uint8Array()])).rejects.toThrow("Failed to merge PDFs");
    });

    it("accepts ArrayBuffer inputs", async () => {
        mockInitQpdfModule.mockResolvedValue(makeFakeModule() as never);

        const result = await mergePdfs([new ArrayBuffer(4), new ArrayBuffer(4)]);

        expect(result.sourceCount).toBe(2);
    });
});
