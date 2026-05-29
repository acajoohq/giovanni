/** HTML class injected when the web app runs inside the Tauri desktop shell. */
export const DESKTOP_CLIENT_HTML_CLASS = "desktopClient";

/** HTML class injected for the macOS desktop shell (overlay title bar, traffic inset). */
export const DESKTOP_MACOS_HTML_CLASS = "desktopMacOS";

/** Tauri v2 runtime namespace on `window` (avoids bundling `@tauri-apps/api` in the web build). */
export const TAURI_INTERNALS_NAMESPACE = "__TAURI_INTERNALS__";

/** Activity Monitor visible title bar: 51pt = 19 top + 12 lights + 20 bottom. Tauri clips 2px. */
export const DESKTOP_MACOS_TOOLBAR_HEIGHT_PX = 53;

/** Left padding that clears the traffic-light cluster (px). */
export const DESKTOP_MACOS_TRAFFIC_INSET_PX = 96;
