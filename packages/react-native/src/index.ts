/**
 * @acajoo/giovanni-react-native
 *
 * Call `setupGiovanni()` once at app startup (e.g. in index.js before the app
 * renders) to swap the default WASM bindings for the native JSI bindings.
 *
 * The native module must already be linked -- GiovanniModule calls
 * pdfly::jsi::install(rt) and exposes it as globalThis.giovanni.
 *
 * @example
 * ```typescript
 * // index.js
 * import { setupGiovanni } from "@acajoo/giovanni-react-native";
 * setupGiovanni();
 *
 * import { AppRegistry } from "react-native";
 * import App from "./App";
 * AppRegistry.registerComponent("MyApp", () => App);
 * ```
 */

import { setQpdfBinding } from "@acajoo/giovanni-core/bindings";
import { qpdfJsiBinding } from "@acajoo/giovanni-core/bindings/jsi";

// Ghostscript JSI is not yet built; only qpdf is registered here.
export function setupGiovanni(): void {
    setQpdfBinding(qpdfJsiBinding);
}