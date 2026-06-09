import type { CompressionEngine } from "@giovanni/core";
import type { GhostscriptCompressOptions, GhostscriptPdfSettings } from "@giovanni/core/ghostscript";
import type { QpdfOptimizePreset, WriteOptions } from "@giovanni/core/qpdf";

export type GhostscriptSettings = { preset: GhostscriptPdfSettings } & Required<
    Pick<GhostscriptCompressOptions, "compatibilityLevel" | "colorConversionStrategy" | "downsampleColorImages" | "downsampleGrayImages">
> &
    Pick<GhostscriptCompressOptions, "colorImageResolution" | "grayImageResolution">;

export type QpdfSettings = { preset: QpdfOptimizePreset } & Required<WriteOptions>;
export type SimpleCompressionPreset = "recommended" | "smallest" | "bestQuality";
export type CompressionUiMode = "simple" | "advanced";

export interface CompressionJobSettings {
    uiMode: CompressionUiMode;
    simplePreset: SimpleCompressionPreset;
    engine: CompressionEngine;
    qpdfSettings: QpdfSettings;
    ghostscriptSettings: GhostscriptSettings;
}
