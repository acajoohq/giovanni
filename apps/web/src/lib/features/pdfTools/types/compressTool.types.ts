import type { CompressionEngine } from "@pdfly/wasm";
import type { GhostscriptCompressOptions, GhostscriptPdfSettings } from "@pdfly/wasm/ghostscript";
import type { QpdfOptimizePreset, WriteOptions } from "@pdfly/wasm/qpdf";

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
