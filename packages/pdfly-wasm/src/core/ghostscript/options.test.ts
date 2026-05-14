import { describe, expect, it } from "vitest";
import { GhostscriptValidationError } from "../errors.js";
import { buildGhostscriptArgs, validateGhostscriptOptions } from "./options.js";

describe("validateGhostscriptOptions", () => {
    it("defaults to the default pdfSettings preset", () => {
        expect(validateGhostscriptOptions()).toEqual({ pdfSettings: "default" });
    });

    it("treats preset as an alias for pdfSettings", () => {
        expect(validateGhostscriptOptions({ preset: "screen" })).toEqual({ pdfSettings: "screen" });
    });

    it("rejects mismatched preset and pdfSettings", () => {
        expect(() => validateGhostscriptOptions({ preset: "screen", pdfSettings: "ebook" })).toThrow(GhostscriptValidationError);
    });

    it("enables downsampling automatically when a resolution is set", () => {
        expect(validateGhostscriptOptions({ colorImageResolution: 96 })).toMatchObject({
            colorImageResolution: 96,
            downsampleColorImages: true,
        });
    });

    it("rejects invalid JPEG quality", () => {
        expect(() => validateGhostscriptOptions({ jpegQuality: 101 })).toThrow(GhostscriptValidationError);
    });
});

describe("buildGhostscriptArgs", () => {
    it("maps normalized options to Ghostscript CLI flags", () => {
        const args = buildGhostscriptArgs(
            validateGhostscriptOptions({
                preset: "screen",
                compatibilityLevel: "1.4",
                colorConversionStrategy: "RGB",
                colorImageResolution: 96,
                jpegQuality: 75,
            })
        );

        expect(args).toEqual(
            expect.arrayContaining([
                "-sDEVICE=pdfwrite",
                "-dPDFSETTINGS=/screen",
                "-dCompatibilityLevel=1.4",
                "-sColorConversionStrategy=RGB",
                "-dDownsampleColorImages=true",
                "-dColorImageResolution=96",
                "-dJPEGQ=75",
            ])
        );
    });
});
