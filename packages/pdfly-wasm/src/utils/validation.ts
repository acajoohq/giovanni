import { QpdfValidationError } from "../core/errors.js";
import type { CompressionOptions, DecodeLevel, ObjectStreamMode } from "../types/options.js";
import type { WasmCompressionOptions } from "../types/wasm-module.js";

/**
 * Normalize input buffer to Uint8Array
 */
export function normalizeBuffer(input: Uint8Array | ArrayBuffer): Uint8Array {
    if (input instanceof Uint8Array) {
        return input;
    }
    if (input instanceof ArrayBuffer) {
        return new Uint8Array(input);
    }
    throw new QpdfValidationError("Input must be a Uint8Array or ArrayBuffer");
}

/**
 * Validate and normalize compression options
 */
export function validateCompressionOptions(options?: CompressionOptions): WasmCompressionOptions {
    const defaults: WasmCompressionOptions = {
        compressionLevel: 6,
        decodeLevel: "generalized",
        recompressFlate: true,
        objectStreams: "generate",
        compressPages: false,
        removeUnreferencedResources: false,
    };

    if (!options) {
        return defaults;
    }

    const result = { ...defaults };

    // TODO use zod schema validation instead

    if (options.compressionLevel !== undefined) {
        if (!Number.isInteger(options.compressionLevel) || options.compressionLevel < 1 || options.compressionLevel > 9) {
            throw new QpdfValidationError("compressionLevel must be an integer between 1 and 9");
        }
        result.compressionLevel = options.compressionLevel;
    }

    if (options.decodeLevel !== undefined) {
        const validDecodeLevels: DecodeLevel[] = ["none", "generalized", "specialized", "all"];
        if (!validDecodeLevels.includes(options.decodeLevel)) {
            throw new QpdfValidationError(`decodeLevel must be one of: ${validDecodeLevels.join(", ")}`);
        }
        result.decodeLevel = options.decodeLevel;
    }

    if (options.objectStreams !== undefined) {
        const validModes: ObjectStreamMode[] = ["preserve", "disable", "generate"];
        if (!validModes.includes(options.objectStreams)) {
            throw new QpdfValidationError(`objectStreams must be one of: ${validModes.join(", ")}`);
        }
        result.objectStreams = options.objectStreams;
    }

    if (options.recompressFlate !== undefined) {
        result.recompressFlate = Boolean(options.recompressFlate);
    }

    if (options.compressPages !== undefined) {
        result.compressPages = Boolean(options.compressPages);
    }

    if (options.removeUnreferencedResources !== undefined) {
        result.removeUnreferencedResources = Boolean(options.removeUnreferencedResources);
    }

    return result;
}
