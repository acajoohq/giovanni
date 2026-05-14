import { GhostscriptValidationError } from "../../errors/index.js";
import type { GhostscriptColorConversionStrategy, GhostscriptCompatibilityLevel, GhostscriptCompressOptions, GhostscriptPdfSettings } from "../../types/ghostscript-options.js";

export interface NormalizedGhostscriptOptions {
    pdfSettings: GhostscriptPdfSettings;
    compatibilityLevel?: GhostscriptCompatibilityLevel;
    colorConversionStrategy?: GhostscriptColorConversionStrategy;
    downsampleColorImages?: boolean;
    downsampleGrayImages?: boolean;
    downsampleMonoImages?: boolean;
    colorImageResolution?: number;
    grayImageResolution?: number;
    monoImageResolution?: number;
    jpegQuality?: number;
}

export function validateGhostscriptOptions(options?: GhostscriptCompressOptions): NormalizedGhostscriptOptions {
    const pdfSettings = normalizePdfSettings(options);
    const normalized: NormalizedGhostscriptOptions = {
        pdfSettings,
    };

    if (options?.compatibilityLevel !== undefined) {
        const valid: GhostscriptCompatibilityLevel[] = ["1.3", "1.4", "1.5", "1.6", "1.7"];
        if (!valid.includes(options.compatibilityLevel)) {
            throw new GhostscriptValidationError(`compatibilityLevel must be one of: ${valid.join(", ")}`);
        }
        normalized.compatibilityLevel = options.compatibilityLevel;
    }

    if (options?.colorConversionStrategy !== undefined) {
        const valid: GhostscriptColorConversionStrategy[] = ["LeaveColorUnchanged", "Gray", "RGB", "CMYK", "UseDeviceIndependentColor"];
        if (!valid.includes(options.colorConversionStrategy)) {
            throw new GhostscriptValidationError(`colorConversionStrategy must be one of: ${valid.join(", ")}`);
        }
        normalized.colorConversionStrategy = options.colorConversionStrategy;
    }

    normalized.colorImageResolution = validateResolution("colorImageResolution", options?.colorImageResolution);
    normalized.grayImageResolution = validateResolution("grayImageResolution", options?.grayImageResolution);
    normalized.monoImageResolution = validateResolution("monoImageResolution", options?.monoImageResolution);

    normalized.downsampleColorImages = normalizeDownsampleFlag(options?.downsampleColorImages, normalized.colorImageResolution);
    normalized.downsampleGrayImages = normalizeDownsampleFlag(options?.downsampleGrayImages, normalized.grayImageResolution);
    normalized.downsampleMonoImages = normalizeDownsampleFlag(options?.downsampleMonoImages, normalized.monoImageResolution);

    if (options?.jpegQuality !== undefined) {
        if (!Number.isInteger(options.jpegQuality) || options.jpegQuality < 0 || options.jpegQuality > 100) {
            throw new GhostscriptValidationError("jpegQuality must be an integer between 0 and 100");
        }
        normalized.jpegQuality = options.jpegQuality;
    }

    return normalized;
}

export function buildGhostscriptArgs(options: NormalizedGhostscriptOptions): string[] {
    const args = ["-sDEVICE=pdfwrite", "-dBATCH", "-dNOPAUSE", "-dSAFER", "-dQUIET", `-dPDFSETTINGS=/${options.pdfSettings}`];

    if (options.compatibilityLevel) {
        args.push(`-dCompatibilityLevel=${options.compatibilityLevel}`);
    }
    if (options.colorConversionStrategy) {
        args.push(`-sColorConversionStrategy=${options.colorConversionStrategy}`);
    }

    appendBooleanArg(args, "DownsampleColorImages", options.downsampleColorImages);
    appendBooleanArg(args, "DownsampleGrayImages", options.downsampleGrayImages);
    appendBooleanArg(args, "DownsampleMonoImages", options.downsampleMonoImages);
    appendNumberArg(args, "ColorImageResolution", options.colorImageResolution);
    appendNumberArg(args, "GrayImageResolution", options.grayImageResolution);
    appendNumberArg(args, "MonoImageResolution", options.monoImageResolution);
    appendNumberArg(args, "JPEGQ", options.jpegQuality);

    return args;
}

function normalizePdfSettings(options?: GhostscriptCompressOptions): GhostscriptPdfSettings {
    const preset = options?.preset;
    const pdfSettings = options?.pdfSettings;

    if (preset && pdfSettings && preset !== pdfSettings) {
        throw new GhostscriptValidationError("preset and pdfSettings must match when both are provided");
    }

    const value = pdfSettings ?? preset ?? "default";
    const valid: GhostscriptPdfSettings[] = ["screen", "ebook", "printer", "prepress", "default"];
    if (!valid.includes(value)) {
        throw new GhostscriptValidationError(`pdfSettings must be one of: ${valid.join(", ")}`);
    }

    return value;
}

function validateResolution(name: string, value: number | undefined): number | undefined {
    if (value === undefined) {
        return undefined;
    }

    if (!Number.isInteger(value) || value <= 0) {
        throw new GhostscriptValidationError(`${name} must be a positive integer`);
    }

    return value;
}

function normalizeDownsampleFlag(flag: boolean | undefined, resolution: number | undefined): boolean | undefined {
    if (flag !== undefined) {
        return Boolean(flag);
    }

    return resolution !== undefined ? true : undefined;
}

function appendBooleanArg(args: string[], name: string, value: boolean | undefined): void {
    if (value !== undefined) {
        args.push(`-d${name}=${value ? "true" : "false"}`);
    }
}

function appendNumberArg(args: string[], name: string, value: number | undefined): void {
    if (value !== undefined) {
        args.push(`-d${name}=${value}`);
    }
}
