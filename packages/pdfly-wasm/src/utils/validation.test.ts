import { describe, it, expect } from "vitest";
import { QpdfValidationError } from "../errors/index.js";
import type { OptimizeOptions } from "../types/qpdf.types.js";
import { normalizeBuffer, validateOptimizeOptions } from "./validation.js";

describe("Validation Utilities", () => {
    describe("normalizeBuffer", () => {
        it("should return Uint8Array as-is", () => {
            const buffer = new Uint8Array([1, 2, 3]);
            const result = normalizeBuffer(buffer);
            expect(result).toBe(buffer);
        });

        it("should convert ArrayBuffer to Uint8Array", () => {
            const arrayBuffer = new ArrayBuffer(3);
            const result = normalizeBuffer(arrayBuffer);
            expect(result).toBeInstanceOf(Uint8Array);
            expect(result.byteLength).toBe(3);
        });

        it("should throw on invalid input", () => {
            expect(() => normalizeBuffer("invalid" as unknown as Uint8Array)).toThrow(QpdfValidationError);
        });
    });

    describe("validateOptimizeOptions", () => {
        it("should return defaults for undefined options", () => {
            const result = validateOptimizeOptions();
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

        it("should accept valid compression level", () => {
            const result = validateOptimizeOptions({ compressionLevel: 9 });
            expect(result.compressionLevel).toBe(9);
        });

        it("should reject invalid compression level", () => {
            expect(() => validateOptimizeOptions({ compressionLevel: 0 })).toThrow(QpdfValidationError);

            expect(() => validateOptimizeOptions({ compressionLevel: 10 })).toThrow(QpdfValidationError);

            expect(() => validateOptimizeOptions({ compressionLevel: 5.5 })).toThrow(QpdfValidationError);
        });

        it("should accept valid decode level", () => {
            const result = validateOptimizeOptions({ decodeLevel: "all" });
            expect(result.decodeLevel).toBe("all");
        });

        it("should reject invalid decode level", () => {
            expect(() => validateOptimizeOptions({ decodeLevel: "invalid" } as unknown as OptimizeOptions)).toThrow(QpdfValidationError);
        });

        it("should accept valid object streams mode", () => {
            const result = validateOptimizeOptions({ objectStreams: "generate" });
            expect(result.objectStreams).toBe("generate");
        });

        it("should reject invalid object streams mode", () => {
            expect(() =>
                validateOptimizeOptions({
                    objectStreams: "invalid",
                } as unknown as OptimizeOptions),
            ).toThrow(QpdfValidationError);
        });

        it("should coerce boolean values", () => {
            const result = validateOptimizeOptions({
                recompressFlate: 1,
                compressPages: "true",
            } as unknown as OptimizeOptions);
            expect(result.recompressFlate).toBe(true);
            expect(result.compressPages).toBe(true);
        });

        it("applies the web preset", () => {
            const result = validateOptimizeOptions({ preset: "web" });
            expect(result.linearize).toBe(true);
            expect(result.objectStreams).toBe("generate");
        });
    });
});
