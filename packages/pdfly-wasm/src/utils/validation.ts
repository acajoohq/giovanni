import { QpdfValidationError } from "../core/errors.js";
import type { DecodeLevel, ObjectStreamMode, OptimizeOptions, QpdfOptimizePreset, WriteOptions } from "../types/options.js";
import type { WasmCompressionOptions } from "../types/wasm-module.js";

export function normalizeBuffer(input: Uint8Array | ArrayBuffer): Uint8Array {
    if (input instanceof Uint8Array) return input;
    if (input instanceof ArrayBuffer) return new Uint8Array(input);
    throw new QpdfValidationError("Input must be a Uint8Array or ArrayBuffer");
}

export const OPTIMIZE_PRESETS = {
    default: {
        compressionLevel: 6,
        decodeLevel: "generalized",
        recompressFlate: true,
        objectStreams: "generate",
        compressPages: false,
        removeUnreferencedResources: false,
        linearize: false,
    },
    web: {
        compressionLevel: 6,
        decodeLevel: "generalized",
        recompressFlate: true,
        objectStreams: "generate",
        compressPages: false,
        removeUnreferencedResources: false,
        linearize: true,
    },
    archive: {
        compressionLevel: 6,
        // "generalized" recompresses LZW/predictor/zlib without touching DCTDecode (JPEG).
        // "all" would re-encode JPEG to Flate, which is always larger for photos.
        decodeLevel: "generalized",
        recompressFlate: true,
        objectStreams: "generate",
        compressPages: true,
        removeUnreferencedResources: true,
        linearize: false,
    },
} satisfies Record<QpdfOptimizePreset, Required<WriteOptions>>;

export function validateOptimizeOptions(options?: OptimizeOptions): WasmCompressionOptions {
    const presetName = options?.preset ?? "default";
    const preset = OPTIMIZE_PRESETS[presetName];
    if (!preset) {
        throw new QpdfValidationError(`preset must be one of: ${Object.keys(OPTIMIZE_PRESETS).join(", ")}`);
    }
    return validateWriteOptions({ ...preset, ...options });
}

export function validateWriteOptions(options?: WriteOptions): WasmCompressionOptions {
    const result: WasmCompressionOptions = { ...OPTIMIZE_PRESETS.default };

    if (!options) return result;

    if (options.compressionLevel !== undefined) {
        if (!Number.isInteger(options.compressionLevel) || options.compressionLevel < 1 || options.compressionLevel > 9) {
            throw new QpdfValidationError("compressionLevel must be an integer between 1 and 9");
        }
        result.compressionLevel = options.compressionLevel;
    }

    if (options.decodeLevel !== undefined) {
        const valid: DecodeLevel[] = ["none", "generalized", "specialized", "all"];
        if (!valid.includes(options.decodeLevel)) {
            throw new QpdfValidationError(`decodeLevel must be one of: ${valid.join(", ")}`);
        }
        result.decodeLevel = options.decodeLevel;
    }

    if (options.objectStreams !== undefined) {
        const valid: ObjectStreamMode[] = ["preserve", "disable", "generate"];
        if (!valid.includes(options.objectStreams)) {
            throw new QpdfValidationError(`objectStreams must be one of: ${valid.join(", ")}`);
        }
        result.objectStreams = options.objectStreams;
    }

    if (options.recompressFlate !== undefined) result.recompressFlate = Boolean(options.recompressFlate);
    if (options.compressPages !== undefined) result.compressPages = Boolean(options.compressPages);
    if (options.removeUnreferencedResources !== undefined) result.removeUnreferencedResources = Boolean(options.removeUnreferencedResources);
    if (options.linearize !== undefined) result.linearize = Boolean(options.linearize);

    return result;
}

export function getOptimizePreset(options?: OptimizeOptions): QpdfOptimizePreset {
    return options?.preset ?? "default";
}
