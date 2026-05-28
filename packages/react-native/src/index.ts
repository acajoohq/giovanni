/**
 * @giovanni/react-native
 *
 * Call `setupPdfly()` once at app startup (e.g. in index.js before the app
 * renders) to swap the default WASM bindings for the native JSI bindings.
 *
 * The native module must already be linked — the pdfly TurboModule calls
 * pdfly::jsi::install(rt) during its initialization, which populates
 * globalThis.pdfly before any JS runs.
 *
 * @example
 * ```typescript
 * // index.js
 * import { setupPdfly } from "@giovanni/react-native";
 * setupPdfly();
 *
 * import { AppRegistry } from "react-native";
 * import App from "./App";
 * AppRegistry.registerComponent("MyApp", () => App);
 * ```
 */

import { setQpdfBinding, setGhostscriptBinding } from "@giovanni/core/bindings";
import { qpdfJsiBinding, ghostscriptJsiBinding } from "@giovanni/core/bindings/jsi";

export function setupPdfly(): void {
    setQpdfBinding(qpdfJsiBinding);
    setGhostscriptBinding(ghostscriptJsiBinding);
}

export { qpdfJsiBinding, ghostscriptJsiBinding };
