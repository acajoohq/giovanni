import { beforeEach, describe, expect, it, vi } from "vitest";
import { compressPdfWithGhostscript } from "../ghostscript/compress.js";
import { compressPdfWithQpdf } from "../qpdf/optimize.js";
import { compressPdfWithCombined } from "./compress.js";

vi.mock("../ghostscript/compress.js");
vi.mock("../qpdf/optimize.js");

const mockCompressPdfWithGhostscript = vi.mocked(compressPdfWithGhostscript);
const mockCompressPdfWithQpdf = vi.mocked(compressPdfWithQpdf);

beforeEach(() => {
    vi.resetAllMocks();
});

function stubGhostscriptPass(data: Uint8Array, preset: "default" | "screen" | "ebook" | "printer" | "prepress" = "default") {
    mockCompressPdfWithGhostscript.mockResolvedValue({
        engine: "ghostscript",
        data,
        preset,
        originalSize: 1000,
        compressedSize: data.byteLength,
        compressionRatio: data.byteLength / 1000,
        savedBytes: 1000 - data.byteLength,
        percentageSaved: ((1000 - data.byteLength) / 1000) * 100,
    });
}

function stubQpdfPass(data: Uint8Array) {
    mockCompressPdfWithQpdf.mockResolvedValue({
        engine: "qpdf",
        data,
        preset: "default",
        originalSize: 700,
        compressedSize: data.byteLength,
        compressionRatio: data.byteLength / 700,
        savedBytes: 700 - data.byteLength,
        percentageSaved: ((700 - data.byteLength) / 700) * 100,
    });
}

describe("compressPdfWithCombined", () => {
    it("runs the Ghostscript pass first, then feeds its output into the qpdf pass", async () => {
        const ghostscriptOutput = new Uint8Array(700);
        const qpdfOutput = new Uint8Array(500);
        stubGhostscriptPass(ghostscriptOutput, "ebook");
        stubQpdfPass(qpdfOutput);

        const options = { ghostscript: { preset: "ebook" as const }, qpdf: { linearize: true } };
        await compressPdfWithCombined(new Uint8Array(1000), options);

        expect(mockCompressPdfWithGhostscript).toHaveBeenCalledWith(expect.any(Uint8Array), options.ghostscript);
        expect(mockCompressPdfWithQpdf).toHaveBeenCalledWith(ghostscriptOutput, options.qpdf);
    });

    it("reports size statistics against the original input, not the intermediate buffer", async () => {
        stubGhostscriptPass(new Uint8Array(700));
        stubQpdfPass(new Uint8Array(500));

        const result = await compressPdfWithCombined(new Uint8Array(1000));

        expect(result.originalSize).toBe(1000);
        expect(result.compressedSize).toBe(500);
        expect(result.savedBytes).toBe(500);
        expect(result.compressionRatio).toBeCloseTo(0.5);
    });

    it("returns the final qpdf-pass data and the Ghostscript preset", async () => {
        stubGhostscriptPass(new Uint8Array(700), "printer");
        const qpdfOutput = new Uint8Array(500);
        stubQpdfPass(qpdfOutput);

        const result = await compressPdfWithCombined(new Uint8Array(1000));

        expect(result.engine).toBe("combined");
        expect(result.data).toBe(qpdfOutput);
        expect(result.preset).toBe("printer");
    });

    it("propagates errors from the Ghostscript pass without running the qpdf pass", async () => {
        mockCompressPdfWithGhostscript.mockRejectedValue(new Error("ghostscript failed"));

        await expect(compressPdfWithCombined(new Uint8Array(1000))).rejects.toThrow("ghostscript failed");
        expect(mockCompressPdfWithQpdf).not.toHaveBeenCalled();
    });

    it("propagates errors from the qpdf pass", async () => {
        stubGhostscriptPass(new Uint8Array(700));
        mockCompressPdfWithQpdf.mockRejectedValue(new Error("qpdf failed"));

        await expect(compressPdfWithCombined(new Uint8Array(1000))).rejects.toThrow("qpdf failed");
    });
});
