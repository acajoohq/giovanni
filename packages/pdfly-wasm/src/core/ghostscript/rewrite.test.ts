import { beforeEach, describe, expect, it, vi } from "vitest";
import { GhostscriptCompressionError } from "../errors.js";
import { compressPdfWithGhostscript, rewritePdfWithGhostscript } from "./rewrite.js";
import { withGhostscriptExecution } from "./runtime.js";

vi.mock("./runtime.js");

const mockWithGhostscriptExecution = vi.mocked(withGhostscriptExecution);

beforeEach(() => {
    vi.resetAllMocks();
});

describe("rewritePdfWithGhostscript", () => {
    it("passes owned bytes and CLI args to the native Ghostscript wrapper", async () => {
        const output = new Uint8Array([1, 2, 3]);
        const rewritePdf = vi.fn<(data: Uint8Array, args: string[]) => Uint8Array>(() => output);
        mockWithGhostscriptExecution.mockImplementation(async (operation) =>
            operation({
                rewritePdf,
                getVersion: () => "10.07",
            } as never),
        );

        await rewritePdfWithGhostscript(new Uint8Array([9, 8, 7]), {
            preset: "screen",
            colorImageResolution: 96,
        });

        expect(rewritePdf).toHaveBeenCalledWith(
            expect.any(Uint8Array),
            expect.arrayContaining(["-sDEVICE=pdfwrite", "-dPDFSETTINGS=/screen", "-dColorImageResolution=96"]),
        );
    });

    it("copies output out of WASM-owned memory via slice()", async () => {
        const output = new Uint8Array([1, 2, 3]);
        const sliceSpy = vi.spyOn(output, "slice");
        mockWithGhostscriptExecution.mockImplementation(async (operation) =>
            operation({
                rewritePdf: () => output,
                getVersion: () => "10.07",
            } as never),
        );

        await rewritePdfWithGhostscript(new Uint8Array([9, 8, 7]));

        expect(sliceSpy).toHaveBeenCalled();
    });

    it("wraps native failures in GhostscriptCompressionError", async () => {
        mockWithGhostscriptExecution.mockRejectedValue(new Error("native crash"));

        await expect(rewritePdfWithGhostscript(new Uint8Array())).rejects.toBeInstanceOf(GhostscriptCompressionError);
        await expect(rewritePdfWithGhostscript(new Uint8Array())).rejects.toThrow("Failed to rewrite PDF with Ghostscript");
    });
});

describe("compressPdfWithGhostscript", () => {
    it("returns unified compression metrics", async () => {
        mockWithGhostscriptExecution.mockImplementation(async (operation) =>
            operation({
                rewritePdf: () => new Uint8Array(400),
                getVersion: () => "10.07",
            } as never),
        );

        const result = await compressPdfWithGhostscript(new Uint8Array(1000), { preset: "ebook" });

        expect(result.engine).toBe("ghostscript");
        expect(result.preset).toBe("ebook");
        expect(result.originalSize).toBe(1000);
        expect(result.compressedSize).toBe(400);
    });
});
