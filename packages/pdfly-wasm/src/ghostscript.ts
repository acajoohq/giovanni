import { initGhostscriptModule } from "./engines/ghostscript/module-loader.js";

export async function initGhostscript(): Promise<void> {
    await initGhostscriptModule();
}

export async function getGhostscriptVersion(): Promise<string> {
    const module = await initGhostscriptModule();
    return module.getVersion();
}

export { compressPdfWithGhostscript } from "./engines/ghostscript/rewrite.js";
export { GHOSTSCRIPT_PRESETS } from "./engines/ghostscript/options.js";

export type { GhostscriptColorConversionStrategy, GhostscriptCompatibilityLevel, GhostscriptCompressOptions, GhostscriptPdfSettings } from "./types/ghostscript.types.js";
