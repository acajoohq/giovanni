import type { CompressOptions } from "@pdfly/wasm";
import type { GhostscriptPdfSettings } from "@pdfly/wasm/ghostscript";
import { GHOSTSCRIPT_ENGINE_PRESETS, SIMPLE_COMPRESSION_PRESETS } from "../constants/compressTool.constants";
import type { GhostscriptSettings, SimpleCompressionPreset } from "../types/compressTool.types";

export function getSimpleCompressionOptions(preset: SimpleCompressionPreset): CompressOptions {
    return { ...SIMPLE_COMPRESSION_PRESETS[preset] };
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
