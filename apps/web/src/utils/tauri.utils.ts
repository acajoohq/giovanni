export function isTauri(): boolean {
    if (typeof window === "undefined") {
        return false;
    }

    const internals = (window as unknown as Record<string, unknown>)["__TAURI_INTERNALS__"];
    return internals !== undefined && internals !== null;
}

export function isTauriMacOs(): boolean {
    if (!isTauri()) {
        return false;
    }

    return typeof navigator !== "undefined" && /Mac|iPhone|iPod|iPad/.test(navigator.platform);
}
