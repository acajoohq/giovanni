/**
 * @giovanni/react-native
 *
 * Call `setupGiovanni()` once at app startup (e.g. in index.js before the app
 * renders) to swap the default WASM bindings for the native JSI bindings.
 *
 * The native module must already be linked -- the giovanni TurboModule calls
 * giovanni::jsi::install(rt) during its initialization, which populates
 * globalThis.giovanni before any JS runs.
 *
 * @example
 * ```typescript
 * // index.js
 * import { setupGiovanni } from "@giovanni/react-native";
 * setupGiovanni();
 *
 * import { AppRegistry } from "react-native";
 * import App from "./App";
 * AppRegistry.registerComponent("MyApp", () => App);
 * ```
 */

import { setQpdfBinding, setGhostscriptBinding } from "@giovanni/core/bindings";
import { qpdfJsiBinding, ghostscriptJsiBinding } from "@giovanni/core/bindings/jsi";

export function setupGiovanni(): void {
    setQpdfBinding(qpdfJsiBinding);
    setGhostscriptBinding(ghostscriptJsiBinding);
}

export { qpdfJsiBinding, ghostscriptJsiBinding };
