import { beforeEach, describe, expect, it, vi } from "vitest";
import { GhostscriptCompressionError, GhostscriptValidationError } from "../../errors/index.js";
import { withGhostscriptExecution } from "./execution.js";
import { compressPdfWithGhostscript } from "./compress.js";

vi.mock("./execution.js");

const mockWithGhostscriptExecution = vi.mocked(withGhostscriptExecution);

beforeEach(() => {
    vi.resetAllMocks();
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

    it("wraps native failures in GhostscriptCompressionError", async () => {
        mockWithGhostscriptExecution.mockRejectedValue(new Error("native crash"));

        await expect(compressPdfWithGhostscript(new Uint8Array())).rejects.toBeInstanceOf(GhostscriptCompressionError);
        await expect(compressPdfWithGhostscript(new Uint8Array())).rejects.toThrow("Failed to compress PDF with Ghostscript");
    });

    it("preserves Ghostscript validation errors", async () => {
        await expect(compressPdfWithGhostscript(new Uint8Array(), { jpegQuality: 101 })).rejects.toBeInstanceOf(GhostscriptValidationError);
    });
});
