import type { CompressOptions } from "@acajoo/giovanni-core";
import type { GhostscriptPdfSettings } from "@acajoo/giovanni-core/ghostscript";
import { GHOSTSCRIPT_ENGINE_PRESETS, SIMPLE_COMPRESSION_PRESETS } from "../constants/compressTool.constants";
import type { CompressionJobSettings, GhostscriptSettings, SimpleCompressionPreset } from "../types/compressTool.types";

export function getSimpleCompressionOptions(preset: SimpleCompressionPreset): CompressOptions {
    return { ...SIMPLE_COMPRESSION_PRESETS[preset] };
}

function buildGhostscriptOptions(ghostscriptSettings: CompressionJobSettings["ghostscriptSettings"]) {
    return {
        preset: ghostscriptSettings.preset,
        compatibilityLevel: ghostscriptSettings.compatibilityLevel,
        colorConversionStrategy: ghostscriptSettings.colorConversionStrategy,
        downsampleColorImages: ghostscriptSettings.downsampleColorImages,
        downsampleGrayImages: ghostscriptSettings.downsampleGrayImages,
        colorImageResolution: ghostscriptSettings.colorImageResolution,
        grayImageResolution: ghostscriptSettings.grayImageResolution,
    };
}

export function buildCompressionOptions(settings: CompressionJobSettings): CompressOptions {
    if (settings.uiMode === "simple") {
        return getSimpleCompressionOptions(settings.simplePreset);
    }

    if (settings.engine === "qpdf") {
        return {
            engine: "qpdf",
            ...settings.qpdfSettings,
        };
    }

    if (settings.engine === "combined") {
        return {
            engine: "combined",
            ghostscript: buildGhostscriptOptions(settings.ghostscriptSettings),
            qpdf: { ...settings.qpdfSettings },
        };
    }

    return {
        engine: "ghostscript",
        ...buildGhostscriptOptions(settings.ghostscriptSettings),
    };
}

export function snapshotCompressionJobSettings(settings: CompressionJobSettings): CompressionJobSettings {
    return {
        ...settings,
        qpdfSettings: { ...settings.qpdfSettings },
        ghostscriptSettings: { ...settings.ghostscriptSettings },
    };
}

export function applyGhostscriptPreset(currentSettings: GhostscriptSettings, preset: GhostscriptPdfSettings): GhostscriptSettings {
    return {
        ...currentSettings,
        preset,
        colorImageResolution: undefined,
        grayImageResolution: undefined,
        ...GHOSTSCRIPT_ENGINE_PRESETS[preset],
    };
}
