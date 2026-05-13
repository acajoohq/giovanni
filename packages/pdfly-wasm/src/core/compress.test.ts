import { describe, it, expect, vi, beforeEach } from "vitest";
import { QpdfCompressionError } from "./errors.js";
import { optimizePdf, linearizePdf } from "./compress.js";
import { initQpdfModule } from "./module-loader.js";

vi.mock("./module-loader.js");

const mockInitQpdfModule = vi.mocked(initQpdfModule);

function makeFakeModule(compressResult = new Uint8Array(600)) {
    return {
        compressPdf: vi.fn<() => Uint8Array>(() => compressResult),
        splitPages: () => [] as Uint8Array[],
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

describe("optimizePdf", () => {
    it("returns correct size statistics", async () => {
        const output = new Uint8Array(600);
        mockInitQpdfModule.mockResolvedValue(makeFakeModule(output) as never);

        const result = await optimizePdf(new Uint8Array(1000));

        expect(result.originalSize).toBe(1000);
        expect(result.compressedSize).toBe(600);
        expect(result.savedBytes).toBe(400);
        expect(result.compressionRatio).toBeCloseTo(0.6);
        expect(result.percentageSaved).toBeCloseTo(40);
    });

    it("includes the preset name in the result", async () => {
        mockInitQpdfModule.mockResolvedValue(makeFakeModule() as never);

        const result = await optimizePdf(new Uint8Array(), { preset: "web" });

        expect(result.preset).toBe("web");
    });

    it("defaults preset to 'default'", async () => {
        mockInitQpdfModule.mockResolvedValue(makeFakeModule() as never);

        const result = await optimizePdf(new Uint8Array());

        expect(result.preset).toBe("default");
    });

    it("copies output out of WASM heap via slice()", async () => {
        const wasmBuffer = new Uint8Array([1, 2, 3]);
        const sliceSpy = vi.spyOn(wasmBuffer, "slice");
        mockInitQpdfModule.mockResolvedValue(makeFakeModule(wasmBuffer) as never);

        await optimizePdf(new Uint8Array());

        expect(sliceSpy).toHaveBeenCalled();
    });

    it("wraps WASM failures in QpdfCompressionError", async () => {
        mockInitQpdfModule.mockRejectedValue(new Error("WASM crash"));

        await expect(optimizePdf(new Uint8Array())).rejects.toBeInstanceOf(QpdfCompressionError);
        await expect(optimizePdf(new Uint8Array())).rejects.toThrow("Failed to optimize PDF");
    });

    it("accepts ArrayBuffer input", async () => {
        mockInitQpdfModule.mockResolvedValue(makeFakeModule() as never);

        const result = await optimizePdf(new ArrayBuffer(100));

        expect(result.originalSize).toBe(100);
    });
});

describe("linearizePdf", () => {
    it("forwards linearize: true to the WASM compressPdf call", async () => {
        const fakeModule = makeFakeModule();
        mockInitQpdfModule.mockResolvedValue(fakeModule as never);

        await linearizePdf(new Uint8Array());

        expect(fakeModule.compressPdf).toHaveBeenCalledWith(expect.any(Uint8Array), expect.objectContaining({ linearize: true }));
    });

    it("includes preset in the result", async () => {
        mockInitQpdfModule.mockResolvedValue(makeFakeModule() as never);

        const result = await linearizePdf(new Uint8Array());

        expect(result.preset).toBe("default");
    });
});
