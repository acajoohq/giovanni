/**
 * Abstraction over the native Ghostscript implementation.
 *
 * Implement this interface to provide a Ghostscript binding for a specific
 * runtime (WASM, JSI, native Node addon, …). Register via
 * {@link setGhostscriptBinding} from `@pdfly/wasm/bindings`.
 *
 * @example
 * ```typescript
 * import { setGhostscriptBinding } from "@pdfly/wasm/bindings";
 * import { myJsiGhostscriptBinding } from "./my-jsi-binding";
 *
 * setGhostscriptBinding(myJsiGhostscriptBinding);
 * ```
 */
export interface GhostscriptBinding {
    /**
     * Initialize the binding (e.g. load WASM, warm up the native bridge).
     * Operations will lazily call this if needed, but pre-calling eliminates
     * first-use latency.
     */
    init(): Promise<void>;

    /**
     * Return the Ghostscript version string.
     */
    getVersion(): Promise<string>;

    /**
     * Run Ghostscript on a PDF with the given argument list.
     *
     * The binding is responsible for managing Ghostscript's non-reentrant
     * execution constraints (e.g. serial queuing for the WASM binding).
     *
     * @param input - Input PDF bytes
     * @param args - Ghostscript CLI arguments
     * @returns Output PDF bytes
     */
    rewritePdf(input: Uint8Array, args: string[]): Promise<Uint8Array>;
}
