import type { GhostscriptCompressOptions, GhostscriptPdfSettings } from "@pdfly/wasm/ghostscript";

export type GhostscriptSettings = { preset: GhostscriptPdfSettings } & Required<
    Pick<GhostscriptCompressOptions, "compatibilityLevel" | "colorConversionStrategy" | "downsampleColorImages" | "downsampleGrayImages">
> &
    Pick<GhostscriptCompressOptions, "colorImageResolution" | "grayImageResolution">;

export type SimpleCompressionPreset = "recommended" | "smallest" | "bestQuality";
