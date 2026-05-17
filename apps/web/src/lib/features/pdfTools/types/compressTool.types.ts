import type { GhostscriptCompressOptions, GhostscriptPdfSettings } from "@pdfly/wasm/ghostscript"

export type GhostscriptSettings = { preset: GhostscriptPdfSettings } & Required<
  Pick<
    GhostscriptCompressOptions,
    "compatibilityLevel" | "colorConversionStrategy" | "downsampleColorImages" | "downsampleGrayImages"
  >
> &
  Pick<GhostscriptCompressOptions, "colorImageResolution" | "grayImageResolution">

export const SIMPLE_COMPRESSION_PRESET_NAMES = ["recommended", "smallest", "bestQuality"] as const

export type SimpleCompressionPreset = (typeof SIMPLE_COMPRESSION_PRESET_NAMES)[number]
