import type { GhostscriptBinding } from "./ghostscript-binding.interface.js";
import type { QpdfBinding } from "./qpdf-binding.interface.js";
import { ghostscriptWasmBinding } from "./wasm/ghostscript-wasm-binding.js";
import { qpdfWasmBinding } from "./wasm/qpdf-wasm-binding.js";

let activeQpdfBinding: QpdfBinding = qpdfWasmBinding;
let activeGhostscriptBinding: GhostscriptBinding = ghostscriptWasmBinding;

/**
 * Get the currently active qpdf binding.
 */
export function getQpdfBinding(): QpdfBinding {
    return activeQpdfBinding;
}

/**
 * Replace the active qpdf binding.
 *
 * Call this before any PDF operation to swap in a custom binding (e.g. JSI for
 * React Native, a native Node addon, or a test stub).
 *
 * @example
 * ```typescript
 * import { setQpdfBinding } from "@giovanni/core/bindings";
 * setQpdfBinding(myJsiQpdfBinding);
 * ```
 */
export function setQpdfBinding(binding: QpdfBinding): void {
    activeQpdfBinding = binding;
}

/**
 * Reset the qpdf binding to the default WASM implementation.
 */
export function resetQpdfBinding(): void {
    activeQpdfBinding = qpdfWasmBinding;
}

/**
 * Get the currently active Ghostscript binding.
 */
export function getGhostscriptBinding(): GhostscriptBinding {
    return activeGhostscriptBinding;
}

/**
 * Replace the active Ghostscript binding.
 *
 * @example
 * ```typescript
 * import { setGhostscriptBinding } from "@giovanni/core/bindings";
 * setGhostscriptBinding(myJsiGhostscriptBinding);
 * ```
 */
export function setGhostscriptBinding(binding: GhostscriptBinding): void {
    activeGhostscriptBinding = binding;
}

/**
 * Reset the Ghostscript binding to the default WASM implementation.
 */
export function resetGhostscriptBinding(): void {
    activeGhostscriptBinding = ghostscriptWasmBinding;
}
