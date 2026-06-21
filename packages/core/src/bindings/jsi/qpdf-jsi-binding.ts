import type { NativeDocumentInfo, NativeExtractedImage, NativeWriteOptions, QpdfBinding } from "../qpdf-binding.interface.js";
import { QpdfInitError } from "../../errors/index.js";

function getGlobal(): NonNullable<typeof globalThis.giovanni> {
    if (!globalThis.giovanni) {
        throw new QpdfInitError("giovanni JSI module is not installed. " + "Call giovanni::jsi::install(rt) from your TurboModule before using any PDF operation.");
    }
    return globalThis.giovanni;
}

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

function toUint8Array(ab: ArrayBuffer): Uint8Array {
    return new Uint8Array(ab);
}

/**
 * qpdf JSI binding for React Native (Hermes).
 *
 * Requires the native giovanni JSI module to be installed before use:
 * call `giovanni::jsi::install(rt)` from your TurboModule, then register:
 *
 * @example
 * ```typescript
 * import { setQpdfBinding } from "@giovanni/core/bindings";
 * import { qpdfJsiBinding } from "@giovanni/core/bindings/jsi";
 *
 * setQpdfBinding(qpdfJsiBinding);
 * ```
 */
export const qpdfJsiBinding: QpdfBinding = {
    async init(): Promise<void> {
        // Eagerly verify the native module is present.
        getGlobal();
    },

    async getVersion(): Promise<string> {
        return getGlobal().getVersion();
    },

    async writePdf(data: Uint8Array, options: NativeWriteOptions, password?: string): Promise<Uint8Array> {
        const result = getGlobal().writePdf(toArrayBuffer(data), options, password);
        return toUint8Array(result);
    },

    async splitPages(data: Uint8Array): Promise<Uint8Array[]> {
        const pages = getGlobal().splitPages(toArrayBuffer(data));
        return pages.map(toUint8Array);
    },

    async mergePdfs(inputs: Uint8Array[]): Promise<Uint8Array> {
        const result = getGlobal().mergePdfs(inputs.map(toArrayBuffer));
        return toUint8Array(result);
    },

    async getDocumentInfo(data: Uint8Array, password?: string): Promise<NativeDocumentInfo> {
        return getGlobal().getDocumentInfo(toArrayBuffer(data), password);
    },

    async extractImages(data: Uint8Array): Promise<NativeExtractedImage[]> {
        const raw = getGlobal().extractImages(toArrayBuffer(data));
        return raw.map((img) => ({
            ...img,
            bytes: toUint8Array(img.bytes),
        }));
    },
};
