import { describe, it, expect } from "vitest";
import { QpdfValidationError } from "../core/errors.js";
import type { CompressionOptions } from "../types/options.js";
import { normalizeBuffer, validateCompressionOptions } from "./validation.js";

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

    describe("validateCompressionOptions", () => {
        it("should return defaults for undefined options", () => {
            const result = validateCompressionOptions();
            expect(result).toEqual({
                compressionLevel: 6,
                decodeLevel: "generalized",
                recompressFlate: true,
                objectStreams: "generate",
                compressPages: false,
                removeUnreferencedResources: false,
            });
        });

        it("should accept valid compression level", () => {
            const result = validateCompressionOptions({ compressionLevel: 9 });
            expect(result.compressionLevel).toBe(9);
        });

        it("should reject invalid compression level", () => {
            expect(() => validateCompressionOptions({ compressionLevel: 0 })).toThrow(QpdfValidationError);

            expect(() => validateCompressionOptions({ compressionLevel: 10 })).toThrow(QpdfValidationError);

            expect(() => validateCompressionOptions({ compressionLevel: 5.5 })).toThrow(QpdfValidationError);
        });

        it("should accept valid decode level", () => {
            const result = validateCompressionOptions({ decodeLevel: "all" });
            expect(result.decodeLevel).toBe("all");
        });

        it("should reject invalid decode level", () => {
            expect(() => validateCompressionOptions({ decodeLevel: "invalid" } as unknown as CompressionOptions)).toThrow(QpdfValidationError);
        });

        it("should accept valid object streams mode", () => {
            const result = validateCompressionOptions({ objectStreams: "generate" });
            expect(result.objectStreams).toBe("generate");
        });

        it("should reject invalid object streams mode", () => {
            expect(() =>
                validateCompressionOptions({
                    objectStreams: "invalid",
                } as unknown as CompressionOptions),
            ).toThrow(QpdfValidationError);
        });

        it("should coerce boolean values", () => {
            const result = validateCompressionOptions({
                recompressFlate: 1,
                compressPages: "true",
            } as unknown as CompressionOptions);
            expect(result.recompressFlate).toBe(true);
            expect(result.compressPages).toBe(true);
        });
    });
});
