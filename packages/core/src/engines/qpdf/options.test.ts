import { describe, expect, it } from "vitest";
import { QpdfValidationError } from "../../errors/index.js";
import type { OptimizeOptions } from "../../types/qpdf.types.js";
import { validateQpdfOptions } from "./options.js";

describe("validateQpdfOptions", () => {
    it("returns defaults for undefined options", () => {
        const result = validateQpdfOptions();

        expect(result).toEqual({
            compressionLevel: 6,
            decodeLevel: "generalized",
            recompressFlate: true,
            objectStreams: "generate",
            compressPages: false,
            removeUnreferencedResources: false,
            linearize: false,
        });
    });

    it("accepts valid compression level", () => {
        const result = validateQpdfOptions({ compressionLevel: 9 });

        expect(result.compressionLevel).toBe(9);
    });

    it("rejects invalid compression level", () => {
        expect(() => validateQpdfOptions({ compressionLevel: 0 })).toThrow(QpdfValidationError);
        expect(() => validateQpdfOptions({ compressionLevel: 10 })).toThrow(QpdfValidationError);
        expect(() => validateQpdfOptions({ compressionLevel: 5.5 })).toThrow(QpdfValidationError);
    });

    it("accepts valid decode level", () => {
        const result = validateQpdfOptions({ decodeLevel: "all" });

        expect(result.decodeLevel).toBe("all");
    });

    it("rejects invalid decode level", () => {
        expect(() => validateQpdfOptions({ decodeLevel: "invalid" } as unknown as OptimizeOptions)).toThrow(QpdfValidationError);
    });

    it("accepts valid object streams mode", () => {
        const result = validateQpdfOptions({ objectStreams: "generate" });

        expect(result.objectStreams).toBe("generate");
    });

    it("rejects invalid object streams mode", () => {
        expect(() =>
            validateQpdfOptions({
                objectStreams: "invalid",
            } as unknown as OptimizeOptions),
        ).toThrow(QpdfValidationError);
    });

    it("coerces boolean values", () => {
        const result = validateQpdfOptions({
            recompressFlate: 1,
            compressPages: "true",
        } as unknown as OptimizeOptions);

        expect(result.recompressFlate).toBe(true);
        expect(result.compressPages).toBe(true);
    });

    it("applies the web preset", () => {
        const result = validateQpdfOptions({ preset: "web" });

        expect(result.linearize).toBe(true);
        expect(result.objectStreams).toBe("generate");
    });
});
