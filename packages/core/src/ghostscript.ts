import { getGhostscriptBinding } from "./bindings/index.js";

export async function initGhostscript(): Promise<void> {
    await getGhostscriptBinding().init();
}

export async function getGhostscriptVersion(): Promise<string> {
    return getGhostscriptBinding().getVersion();
}

export { compressPdfWithGhostscript } from "./engines/ghostscript/compress.js";
export { rewritePdfWithGhostscript } from "./engines/ghostscript/rewrite.js";
export { GHOSTSCRIPT_PRESETS } from "./engines/ghostscript/options.js";

export type { GhostscriptColorConversionStrategy, GhostscriptCompatibilityLevel, GhostscriptCompressOptions, GhostscriptPdfSettings } from "./types/ghostscript.types.js";
