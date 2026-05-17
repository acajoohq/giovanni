import type { CompressOptions } from "@pdfly/wasm";
import { GHOSTSCRIPT_PRESETS, type GhostscriptPdfSettings } from "@pdfly/wasm/ghostscript";
import { QPDF_PRESETS } from "@pdfly/wasm/qpdf";
import type { GhostscriptSettings, SimpleCompressionPreset } from "../types/compressTool.types";

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

export const DEFAULT_GHOSTSCRIPT_SETTINGS: GhostscriptSettings = {
    preset: "default",
    ...GHOSTSCRIPT_ENGINE_PRESETS.default,
};
