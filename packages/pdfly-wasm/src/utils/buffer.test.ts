import { describe, it, expect } from "vitest";
import { toUint8Array } from "./buffer.js";

describe("Buffer Utilities", () => {
    describe("toUint8Array", () => {
        it("should return Uint8Array as-is", () => {
            const buffer = new Uint8Array([1, 2, 3]);
            const result = toUint8Array(buffer);
            expect(result).toBe(buffer);
        });

        it("should convert ArrayBuffer to Uint8Array", () => {
            const arrayBuffer = new ArrayBuffer(3);
            const result = toUint8Array(arrayBuffer);
            expect(result).toBeInstanceOf(Uint8Array);
            expect(result.byteLength).toBe(3);
        });

        it("should throw on invalid input", () => {
            expect(() => toUint8Array("invalid" as unknown as Uint8Array)).toThrow(TypeError);
        });
    });
});
