import type { GhostscriptBinding } from "../ghostscript-binding.interface.js";
import { GhostscriptInitError } from "../../errors/index.js";

function getGlobal(): NonNullable<typeof globalThis.giovanni_gs> {
    if (!globalThis.giovanni_gs) {
        throw new GhostscriptInitError(
            "giovanni Ghostscript JSI module is not installed. " +
                "Call giovanni::jsi::installGs(rt) from your TurboModule before using any Ghostscript operation. " +
                "Note: the targets/jsi/ghostscript native build is not yet implemented.",
        );
    }
    return globalThis.giovanni_gs;
}

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

/**
 * Ghostscript JSI binding for React Native (Hermes).
 *
 * Requires the native giovanni Ghostscript JSI module to be installed before use.
 * Call `giovanni::jsi::installGs(rt)` from your TurboModule (see targets/jsi/ghostscript),
 * then register this binding:
 *
 * @example
 * ```typescript
 * import { setGhostscriptBinding } from "@giovanni/core/bindings";
 * import { ghostscriptJsiBinding } from "@giovanni/core/bindings/jsi";
 *
 * setGhostscriptBinding(ghostscriptJsiBinding);
 * ```
 */
export const ghostscriptJsiBinding: GhostscriptBinding = {
    async init(): Promise<void> {
        getGlobal();
    },

    async getVersion(): Promise<string> {
        return getGlobal().getVersion();
    },

    async rewritePdf(input: Uint8Array, args: string[]): Promise<Uint8Array> {
        const result = getGlobal().rewritePdf(toArrayBuffer(input), args);
        return new Uint8Array(result);
    },
};
