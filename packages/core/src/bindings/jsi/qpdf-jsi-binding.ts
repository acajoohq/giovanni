import type { NativeDocumentInfo, NativeExtractedImage, NativeWriteOptions, QpdfBinding } from "../qpdf-binding.interface.js";

/**
 * Placeholder qpdf JSI binding for React Native.
 *
 * Replace the method bodies with calls to your native JSI module once it is
 * set up. Register this binding via {@link setQpdfBinding}:
 *
 * @example
 * ```typescript
 * import { setQpdfBinding } from "@pdfly/wasm/bindings";
 * import { qpdfJsiBinding } from "@pdfly/wasm/bindings/jsi";
 *
 * setQpdfBinding(qpdfJsiBinding);
 * ```
 */
export const qpdfJsiBinding: QpdfBinding = {
    async init(): Promise<void> {
        // TODO: initialize the native qpdf JSI module
        // e.g. global.__qpdfJsi?.init()
        throw new Error("qpdfJsiBinding: init() is not implemented. Wire up your native JSI module here.");
    },

    async getVersion(): Promise<string> {
        // TODO: return the native qpdf version string
        // e.g. return global.__qpdfJsi.getVersion()
        throw new Error("qpdfJsiBinding: getVersion() is not implemented.");
    },

    async writePdf(data: Uint8Array, options: NativeWriteOptions, password?: string): Promise<Uint8Array> {
        // TODO: call the native writePdf implementation
        // e.g. return global.__qpdfJsi.writePdf(data, options, password)
        throw new Error("qpdfJsiBinding: writePdf() is not implemented.");
    },

    async splitPages(data: Uint8Array): Promise<Uint8Array[]> {
        // TODO: call the native splitPages implementation
        // e.g. return global.__qpdfJsi.splitPages(data)
        throw new Error("qpdfJsiBinding: splitPages() is not implemented.");
    },

    async mergePdfs(inputs: Uint8Array[]): Promise<Uint8Array> {
        // TODO: call the native mergePdfs implementation
        // e.g. return global.__qpdfJsi.mergePdfs(inputs)
        throw new Error("qpdfJsiBinding: mergePdfs() is not implemented.");
    },

    async getDocumentInfo(data: Uint8Array, password?: string): Promise<NativeDocumentInfo> {
        // TODO: call the native getDocumentInfo implementation
        // e.g. return global.__qpdfJsi.getDocumentInfo(data, password)
        throw new Error("qpdfJsiBinding: getDocumentInfo() is not implemented.");
    },

    async extractImages(data: Uint8Array): Promise<NativeExtractedImage[]> {
        // TODO: call the native extractImages implementation
        // e.g. return global.__qpdfJsi.extractImages(data)
        throw new Error("qpdfJsiBinding: extractImages() is not implemented.");
    },
};
