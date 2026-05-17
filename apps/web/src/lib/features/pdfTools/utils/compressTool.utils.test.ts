import { describe, expect, it } from "vitest";
import { DEFAULT_GHOSTSCRIPT_SETTINGS, DEFAULT_SIMPLE_COMPRESSION_PRESET } from "../constants/compressTool.constants";
import { applyGhostscriptPreset, getSimpleCompressionOptions } from "./compressTool.utils";

describe("getSimpleCompressionOptions", () => {
    it("defaults simple compression to the recommended preset", () => {
        expect(DEFAULT_SIMPLE_COMPRESSION_PRESET).toBe("recommended");
    });

    it("maps recommended to the Ghostscript ebook preset", () => {
        expect(getSimpleCompressionOptions("recommended")).toMatchObject({
            engine: "ghostscript",
            preset: "ebook",
            colorImageResolution: 150,
            grayImageResolution: 150,
        });
    });

    it("maps smallest to the Ghostscript screen preset", () => {
        expect(getSimpleCompressionOptions("smallest")).toMatchObject({
            engine: "ghostscript",
            preset: "screen",
            colorImageResolution: 72,
            grayImageResolution: 72,
        });
    });

    it("maps best quality to the QPDF archive preset", () => {
        expect(getSimpleCompressionOptions("bestQuality")).toMatchObject({
            engine: "qpdf",
            preset: "archive",
            compressPages: true,
            removeUnreferencedResources: true,
        });
    });
});

describe("applyGhostscriptPreset", () => {
    it("clears stale image resolutions when switching to presets that do not define them", () => {
        const nextSettings = applyGhostscriptPreset(
            {
                ...DEFAULT_GHOSTSCRIPT_SETTINGS,
                preset: "screen",
                downsampleColorImages: true,
                downsampleGrayImages: true,
                colorImageResolution: 72,
                grayImageResolution: 72,
            },
            "default",
        );

        expect(nextSettings).toMatchObject({
            preset: "default",
            downsampleColorImages: false,
            downsampleGrayImages: false,
        });
        expect(nextSettings.colorImageResolution).toBeUndefined();
        expect(nextSettings.grayImageResolution).toBeUndefined();
    });

    it("applies the selected preset resolutions when present", () => {
        const nextSettings = applyGhostscriptPreset(DEFAULT_GHOSTSCRIPT_SETTINGS, "ebook");

        expect(nextSettings).toMatchObject({
            preset: "ebook",
            downsampleColorImages: true,
            downsampleGrayImages: true,
            colorImageResolution: 150,
            grayImageResolution: 150,
        });
    });
});
