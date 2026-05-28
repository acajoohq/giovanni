import type { CompressOptions } from "@pdfly/wasm";
import { GHOSTSCRIPT_PRESETS, type GhostscriptCompatibilityLevel, type GhostscriptPdfSettings } from "@pdfly/wasm/ghostscript";
import { QPDF_PRESETS, type QpdfOptimizePreset } from "@pdfly/wasm/qpdf";
import type { CompressionUiMode, GhostscriptSettings, QpdfSettings, SimpleCompressionPreset } from "../types/compressTool.types";

export const COMPRESSION_UI_MODES = ["simple", "advanced"] as const satisfies readonly CompressionUiMode[];
export const SIMPLE_COMPRESSION_PRESET_NAMES = ["recommended", "smallest", "bestQuality"] as const satisfies readonly SimpleCompressionPreset[];
export const QPDF_PRESET_NAMES = ["default", "web", "archive"] as const satisfies readonly QpdfOptimizePreset[];
export const GHOSTSCRIPT_PRESET_NAMES = ["default", "screen", "ebook", "printer", "prepress"] as const satisfies readonly GhostscriptPdfSettings[];
export const GHOSTSCRIPT_COMPATIBILITY_LEVELS = ["1.3", "1.4", "1.5", "1.6", "1.7"] as const satisfies readonly GhostscriptCompatibilityLevel[];
export const GHOSTSCRIPT_RESOLUTION_FALLBACK = 144;

export const DEFAULT_SIMPLE_COMPRESSION_PRESET: SimpleCompressionPreset = "recommended";

export const SIMPLE_COMPRESSION_PRESETS: Record<SimpleCompressionPreset, CompressOptions> = {
    recommended: {
        engine: "ghostscript",
        preset: "ebook",
        ...GHOSTSCRIPT_PRESETS.ebook,
    },
    smallest: {
        engine: "ghostscript",
        preset: "screen",
        ...GHOSTSCRIPT_PRESETS.screen,
    },
    bestQuality: {
        engine: "qpdf",
        preset: "archive",
        ...QPDF_PRESETS.archive,
    },
};

export const GHOSTSCRIPT_ENGINE_PRESETS: Record<GhostscriptPdfSettings, Omit<GhostscriptSettings, "preset">> = GHOSTSCRIPT_PRESETS;

export const DEFAULT_QPDF_SETTINGS: QpdfSettings = {
    preset: "default",
    ...QPDF_PRESETS.default,
};

export const DEFAULT_GHOSTSCRIPT_SETTINGS: GhostscriptSettings = {
    preset: "default",
    ...GHOSTSCRIPT_ENGINE_PRESETS.default,
};
