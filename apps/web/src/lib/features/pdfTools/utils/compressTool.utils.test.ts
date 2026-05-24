import { describe, expect, it } from "vitest";
import {
    DEFAULT_GHOSTSCRIPT_SETTINGS,
    DEFAULT_QPDF_SETTINGS,
    DEFAULT_SIMPLE_COMPRESSION_PRESET,
    GHOSTSCRIPT_PRESET_NAMES,
    QPDF_PRESET_NAMES,
    SIMPLE_COMPRESSION_PRESET_NAMES,
} from "../constants/compressTool.constants";
import { applyGhostscriptPreset, buildCompressionOptions, getSimpleCompressionOptions, snapshotCompressionJobSettings } from "./compressTool.utils";

describe("getSimpleCompressionOptions", () => {
    it("keeps simple presets in UI display order", () => {
        expect(SIMPLE_COMPRESSION_PRESET_NAMES).toEqual(["recommended", "smallest", "bestQuality"]);
        expect(QPDF_PRESET_NAMES).toEqual(["default", "web", "archive"]);
        expect(GHOSTSCRIPT_PRESET_NAMES).toEqual(["default", "screen", "ebook", "printer", "prepress"]);
    });

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

describe("buildCompressionOptions", () => {
    it("uses the selected simple preset instead of advanced engine settings in simple mode", () => {
        expect(
            buildCompressionOptions({
                uiMode: "simple",
                simplePreset: "bestQuality",
                engine: "ghostscript",
                qpdfSettings: DEFAULT_QPDF_SETTINGS,
                ghostscriptSettings: DEFAULT_GHOSTSCRIPT_SETTINGS,
            }),
        ).toMatchObject({
            engine: "qpdf",
            preset: "archive",
        });
    });

    it("builds explicit QPDF options for advanced mode", () => {
        expect(
            buildCompressionOptions({
                uiMode: "advanced",
                simplePreset: "recommended",
                engine: "qpdf",
                qpdfSettings: {
                    ...DEFAULT_QPDF_SETTINGS,
                    preset: "web",
                    linearize: true,
                },
                ghostscriptSettings: DEFAULT_GHOSTSCRIPT_SETTINGS,
            }),
        ).toMatchObject({
            engine: "qpdf",
            preset: "web",
            linearize: true,
        });
    });

    it("builds explicit Ghostscript options without leaking UI-only settings", () => {
        expect(
            buildCompressionOptions({
                uiMode: "advanced",
                simplePreset: "bestQuality",
                engine: "ghostscript",
                qpdfSettings: DEFAULT_QPDF_SETTINGS,
                ghostscriptSettings: {
                    ...DEFAULT_GHOSTSCRIPT_SETTINGS,
                    preset: "ebook",
                    colorImageResolution: 150,
                    grayImageResolution: 150,
                },
            }),
        ).toEqual({
            engine: "ghostscript",
            preset: "ebook",
            compatibilityLevel: DEFAULT_GHOSTSCRIPT_SETTINGS.compatibilityLevel,
            colorConversionStrategy: DEFAULT_GHOSTSCRIPT_SETTINGS.colorConversionStrategy,
            downsampleColorImages: DEFAULT_GHOSTSCRIPT_SETTINGS.downsampleColorImages,
            downsampleGrayImages: DEFAULT_GHOSTSCRIPT_SETTINGS.downsampleGrayImages,
            colorImageResolution: 150,
            grayImageResolution: 150,
        });
    });
});

describe("snapshotCompressionJobSettings", () => {
    it("copies nested engine settings so result metadata is stable after UI edits", () => {
        const settings = {
            uiMode: "advanced" as const,
            simplePreset: "recommended" as const,
            engine: "qpdf" as const,
            qpdfSettings: DEFAULT_QPDF_SETTINGS,
            ghostscriptSettings: DEFAULT_GHOSTSCRIPT_SETTINGS,
        };

        const snapshot = snapshotCompressionJobSettings(settings);

        expect(snapshot).toEqual(settings);
        expect(snapshot.qpdfSettings).not.toBe(settings.qpdfSettings);
        expect(snapshot.ghostscriptSettings).not.toBe(settings.ghostscriptSettings);
    });
});
