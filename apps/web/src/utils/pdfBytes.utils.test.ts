import { describe, expect, it } from "vitest";
import { copyPdfBytes, copyPdfEntries } from "./pdfBytes.utils";

describe("pdfBytes", () => {
    it("copies a Uint8Array into an independent buffer", () => {
        const source = new Uint8Array([1, 2, 3]);
        const copy = copyPdfBytes(source);

        source[0] = 9;

        expect(copy).toEqual(new Uint8Array([1, 2, 3]));
        expect(copy.buffer).not.toBe(source.buffer);
    });

    it("copies only the visible range of a Uint8Array view", () => {
        const source = new Uint8Array([9, 1, 2, 9]).subarray(1, 3);
        const copy = copyPdfBytes(source);

        expect(copy).toEqual(new Uint8Array([1, 2]));
        expect(copy.byteOffset).toBe(0);
        expect(copy.byteLength).toBe(2);
    });

    it("copies an ArrayBuffer into an independent Uint8Array", () => {
        const buffer = new Uint8Array([1, 2, 3]).buffer;
        const copy = copyPdfBytes(buffer);

        new Uint8Array(buffer)[0] = 9;

        expect(copy).toEqual(new Uint8Array([1, 2, 3]));
    });

    it("copies ZIP entries before download code consumes them", () => {
        const first = new Uint8Array([1]);
        const second = new Uint8Array([2]);
        const copied = copyPdfEntries({ "one.pdf": first, "two.pdf": second });

        first[0] = 9;
        second[0] = 8;

        expect(copied["one.pdf"]).toEqual(new Uint8Array([1]));
        expect(copied["two.pdf"]).toEqual(new Uint8Array([2]));
    });
});
