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

/** Target inset from window edge to traffic-light top-left (pt) — matches Activity Monitor x and symmetric top. */
export const DESKTOP_MACOS_TRAFFIC_LIGHT_PADDING = { x: 19, y: 19 } as const;

/**
 * Tauri `trafficLightPosition` (wry inset). Measured mapping: button top ≈ y − 5
 * (y=20→15pt, y=22→17pt). For 19pt top padding → y=24.
 */
export const DESKTOP_MACOS_TRAFFIC_LIGHT_POSITION = {
    x: DESKTOP_MACOS_TRAFFIC_LIGHT_PADDING.x,
    y: DESKTOP_MACOS_TRAFFIC_LIGHT_PADDING.y + 5,
} as const;
