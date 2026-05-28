import {
    DESKTOP_CLIENT_HTML_CLASS,
    DESKTOP_MACOS_HTML_CLASS,
    DESKTOP_MACOS_TOOLBAR_HEIGHT_PX,
    DESKTOP_MACOS_TRAFFIC_INSET_PX,
    TAURI_INTERNALS_NAMESPACE,
} from "@/constants/desktop.constants";

type TauriInternals = {
    invoke?: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;
};

export type DesktopInvoke = NonNullable<TauriInternals["invoke"]>;

function getTauriInternals(): TauriInternals | undefined {
    if (typeof window === "undefined") {
        return undefined;
    }

    return (window as unknown as Record<string, unknown>)[TAURI_INTERNALS_NAMESPACE] as TauriInternals | undefined;
}

/** True when the UI runs inside the Giovanni desktop app (Tauri webview). */
export function getIsDesktopClient(): boolean {
    const internals = getTauriInternals();
    return internals !== undefined && internals !== null;
}

/** True when the desktop shell is running on macOS (WKWebView overlay title bar). */
export function getIsDesktopMacOS(): boolean {
    if (!getIsDesktopClient()) {
        return false;
    }

    return typeof navigator !== "undefined" && /Mac|iPhone|iPod|iPad/.test(navigator.platform);
}

/** Tauri command invoke, or `undefined` in the browser. */
export function getDesktopInvoke(): DesktopInvoke | undefined {
    return getTauriInternals()?.invoke;
}

export function injectDesktopHTMLClasses(): void {
    if (!getIsDesktopClient()) {
        return;
    }

    const root = document.documentElement;
    root.classList.add(DESKTOP_CLIENT_HTML_CLASS);

    if (getIsDesktopMacOS()) {
        root.classList.add(DESKTOP_MACOS_HTML_CLASS);
        root.style.setProperty("--app-toolbar-height", `${DESKTOP_MACOS_TOOLBAR_HEIGHT_PX}px`);
        root.style.setProperty("--app-macos-traffic-inset", `${DESKTOP_MACOS_TRAFFIC_INSET_PX}px`);
    }
}

export function removeDesktopHTMLClasses(): void {
    document.documentElement.classList.remove(DESKTOP_CLIENT_HTML_CLASS, DESKTOP_MACOS_HTML_CLASS);
}
