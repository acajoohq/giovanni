import type { GhostscriptBinding } from "../ghostscript-binding.interface.js";

/**
 * Placeholder Ghostscript JSI binding for React Native.
 *
 * Replace the method bodies with calls to your native JSI module once it is
 * set up. Register this binding via {@link setGhostscriptBinding}:
 *
 * @example
 * ```typescript
 * import { setGhostscriptBinding } from "@pdfly/wasm/bindings";
 * import { ghostscriptJsiBinding } from "@pdfly/wasm/bindings/jsi";
 *
 * setGhostscriptBinding(ghostscriptJsiBinding);
 * ```
 */
export const ghostscriptJsiBinding: GhostscriptBinding = {
    async init(): Promise<void> {
        // TODO: initialize the native Ghostscript JSI module
        // e.g. global.__ghostscriptJsi?.init()
        throw new Error("ghostscriptJsiBinding: init() is not implemented. Wire up your native JSI module here.");
    },

    async getVersion(): Promise<string> {
        // TODO: return the native Ghostscript version string
        // e.g. return global.__ghostscriptJsi.getVersion()
        throw new Error("ghostscriptJsiBinding: getVersion() is not implemented.");
    },

    async rewritePdf(input: Uint8Array, args: string[]): Promise<Uint8Array> {
        // TODO: call the native rewritePdf implementation
        // e.g. return global.__ghostscriptJsi.rewritePdf(input, args)
        throw new Error("ghostscriptJsiBinding: rewritePdf() is not implemented.");
    },
};
