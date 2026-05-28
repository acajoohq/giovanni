/** HTML class injected when the web app runs inside the Tauri desktop shell. */
export const DESKTOP_CLIENT_HTML_CLASS = "desktopClient";

/** HTML class injected for the macOS desktop shell (overlay title bar, traffic inset). */
export const DESKTOP_MACOS_HTML_CLASS = "desktopMacOS";

/** Tauri v2 runtime namespace on `window` (avoids bundling `@tauri-apps/api` in the web build). */
export const TAURI_INTERNALS_NAMESPACE = "__TAURI_INTERNALS__";

/** macOS overlay title bar height (px). Activity Monitor reference: 51pt. */
export const DESKTOP_MACOS_TOOLBAR_HEIGHT_PX = 51;

/** Left padding that clears the traffic-light cluster (px). */
export const DESKTOP_MACOS_TRAFFIC_INSET_PX = 96;

/** Window edge → traffic-light top-left (pt). Sync with `trafficLightPosition` in `tauri.conf.json`. */
export const DESKTOP_MACOS_TRAFFIC_LIGHT_PADDING = { x: 19, y: 19 } as const;

// Tauri `y` is a wry title-bar inset, not screen Y. AM's 19pt vertical is the cluster center, not top padding.
// Measure button top edge: top ≈ y − 5 → for 19pt padding use y = padding.y + 5. Restart app after changes.
export const DESKTOP_MACOS_TRAFFIC_LIGHT_POSITION = {
    x: DESKTOP_MACOS_TRAFFIC_LIGHT_PADDING.x,
    y: DESKTOP_MACOS_TRAFFIC_LIGHT_PADDING.y + 5,
} as const;
