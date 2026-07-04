const LANDING_SESSION_PATH_STORAGE_KEY = "giovanni:landing-session-path";

function getSessionStorage() {
    try {
        return globalThis.sessionStorage;
    } catch {
        return undefined;
    }
}

export function readLandingSessionPath() {
    return getSessionStorage()?.getItem(LANDING_SESSION_PATH_STORAGE_KEY) ?? null;
}

export function storeLandingSessionPath(pathname: string) {
    getSessionStorage()?.setItem(LANDING_SESSION_PATH_STORAGE_KEY, pathname);
}

export function clearLandingSessionPath() {
    getSessionStorage()?.removeItem(LANDING_SESSION_PATH_STORAGE_KEY);
}

export function isStoredLandingSessionPath(pathname: string) {
    return readLandingSessionPath() === pathname;
}
