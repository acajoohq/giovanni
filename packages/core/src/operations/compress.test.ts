import { describe, it, expect, vi, beforeEach } from "vitest";
import { QpdfCompressionError, QpdfValidationError } from "../errors/index.js";
import { compressPdf, getAvailableCompressionEngines, initCompressionEngine } from "./compress.js";
import { linearizePdf, optimizePdf } from "../qpdf.js";
import { initQpdfModule } from "../engines/qpdf/module-loader.js";
import { initGhostscriptModule } from "../engines/ghostscript/module-loader.js";
import { compressPdfWithGhostscript } from "../engines/ghostscript/compress.js";
import { GHOSTSCRIPT_PDF_SETTINGS } from "../engines/ghostscript/options.js";

vi.mock("../engines/qpdf/module-loader.js");
vi.mock("../engines/ghostscript/module-loader.js");
vi.mock("../engines/ghostscript/compress.js");

const mockInitQpdfModule = vi.mocked(initQpdfModule);
const mockInitGhostscriptModule = vi.mocked(initGhostscriptModule);
const mockCompressPdfWithGhostscript = vi.mocked(compressPdfWithGhostscript);

function makeFakeModule(compressResult = new Uint8Array(600)) {
    const writerInstance = {
        setCompressStreams: vi.fn(),
        setCompressionLevel: vi.fn(),
        setDecodeLevel: vi.fn(),
        setRecompressFlate: vi.fn(),
        setObjectStreamMode: vi.fn(),
        setLinearization: vi.fn(),
        write: vi.fn(),
        getBuffer: vi.fn(() => compressResult),
        delete: vi.fn(),
    };
    const wrapperInstance = {
        processMemoryFile: vi.fn(),
        coalesceContentStreams: vi.fn(),
        removeUnreferencedResources: vi.fn(),
        getNumPages: vi.fn(() => 1),
        getPDFVersion: vi.fn(() => "1.4"),
        isEncrypted: vi.fn(() => false),
        isLinearized: vi.fn(() => false),
        delete: vi.fn(),
    };
    return {
        compressPdf: vi.fn<() => Uint8Array>(() => compressResult),
        splitPages: () => [] as Uint8Array[],
        mergePdfs: () => new Uint8Array(),
        extractImages: () => [],
        getVersion: () => "11.0.0",
        QPDFWrapper: vi.fn(function () {
            return wrapperInstance;
        }),
        QPDFWriter: vi.fn(function () {
            return writerInstance;
        }),
        _writerInstance: writerInstance,
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
        await expect(optimizePdf(new Uint8Array())).rejects.toThrow("Failed to write PDF");
    });

    it("accepts ArrayBuffer input", async () => {
        mockInitQpdfModule.mockResolvedValue(makeFakeModule() as never);

        const result = await optimizePdf(new ArrayBuffer(100));

        expect(result.originalSize).toBe(100);
    });
});

describe("compressPdf", () => {
    it("defaults to the qpdf engine", async () => {
        mockInitQpdfModule.mockResolvedValue(makeFakeModule() as never);

        const result = await compressPdf(new Uint8Array(1000));

        expect(result.engine).toBe("qpdf");
        expect(result.preset).toBe("default");
    });

    it.each(GHOSTSCRIPT_PDF_SETTINGS)("dispatches the %s preset to Ghostscript", async (preset) => {
        mockCompressPdfWithGhostscript.mockResolvedValue({
            engine: "ghostscript",
            data: new Uint8Array(400),
            preset,
            originalSize: 1000,
            compressedSize: 400,
            compressionRatio: 0.4,
            savedBytes: 600,
            percentageSaved: 60,
        });

        const result = await compressPdf(new Uint8Array(1000), { engine: "ghostscript", preset });

        expect(mockCompressPdfWithGhostscript).toHaveBeenCalledWith(expect.any(Uint8Array), expect.objectContaining({ preset }));
        expect(result.engine).toBe("ghostscript");
    });

    it("rejects invalid runtime compression engines instead of falling back to qpdf", async () => {
        await expect(compressPdf(new Uint8Array(1000), { engine: "bad" } as never)).rejects.toBeInstanceOf(QpdfValidationError);

        expect(mockInitQpdfModule).not.toHaveBeenCalled();
        expect(mockCompressPdfWithGhostscript).not.toHaveBeenCalled();
    });
});

describe("linearizePdf", () => {
    it("forwards linearize: true to the QPDFWriter", async () => {
        const fakeModule = makeFakeModule();
        mockInitQpdfModule.mockResolvedValue(fakeModule as never);

        await linearizePdf(new Uint8Array());

        expect(fakeModule._writerInstance.setLinearization).toHaveBeenCalledWith(true);
    });

    it("includes preset in the result", async () => {
        mockInitQpdfModule.mockResolvedValue(makeFakeModule() as never);

        const result = await linearizePdf(new Uint8Array());

        expect(result.preset).toBe("default");
    });
});

describe("compression engine helpers", () => {
    it("lists the available engines", () => {
        expect(getAvailableCompressionEngines()).toEqual(["qpdf", "ghostscript"]);
    });

    it("initializes qpdf through the existing module loader", async () => {
        mockInitQpdfModule.mockResolvedValue(makeFakeModule() as never);

        await initCompressionEngine("qpdf");

        expect(mockInitQpdfModule).toHaveBeenCalled();
    });

    it("initializes Ghostscript through its module loader", async () => {
        mockInitGhostscriptModule.mockResolvedValue({
            rewritePdf: vi.fn<(data: Uint8Array, args: string[]) => Uint8Array>(() => new Uint8Array()),
            getVersion: vi.fn<() => string>(() => "10.07"),
        } as never);

        await initCompressionEngine("ghostscript");

        expect(mockInitGhostscriptModule).toHaveBeenCalled();
    });
});
