import { describe, it, expect } from "vitest";
import { QpdfValidationError } from "../errors/index.js";
import { normalizeBuffer } from "./validation.js";

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

});
