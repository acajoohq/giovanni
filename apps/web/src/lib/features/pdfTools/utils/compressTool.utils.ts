import type { CompressOptions } from "@pdfly/wasm";
import type { GhostscriptPdfSettings } from "@pdfly/wasm/ghostscript";
import { GHOSTSCRIPT_ENGINE_PRESETS, SIMPLE_COMPRESSION_PRESETS } from "../constants/compressTool.constants";
import type { CompressionJobSettings, GhostscriptSettings, SimpleCompressionPreset } from "../types/compressTool.types";

export function getSimpleCompressionOptions(preset: SimpleCompressionPreset): CompressOptions {
    return { ...SIMPLE_COMPRESSION_PRESETS[preset] };
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

    return {
        engine: "ghostscript",
        preset: settings.ghostscriptSettings.preset,
        compatibilityLevel: settings.ghostscriptSettings.compatibilityLevel,
        colorConversionStrategy: settings.ghostscriptSettings.colorConversionStrategy,
        downsampleColorImages: settings.ghostscriptSettings.downsampleColorImages,
        downsampleGrayImages: settings.ghostscriptSettings.downsampleGrayImages,
        colorImageResolution: settings.ghostscriptSettings.colorImageResolution,
        grayImageResolution: settings.ghostscriptSettings.grayImageResolution,
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
