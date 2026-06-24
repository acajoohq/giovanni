import { afterEach, describe, expect, it, vi } from "vitest";
import { clearLandingSessionPath, isStoredLandingSessionPath, readLandingSessionPath, storeLandingSessionPath } from "./landingSession.utils";

function mockSessionStorage() {
    const entries = new Map<string, string>();

    vi.stubGlobal("sessionStorage", {
        getItem: (key: string) => entries.get(key) ?? null,
        setItem: (key: string, value: string) => entries.set(key, value),
        removeItem: (key: string) => entries.delete(key),
    });
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("landingSession", () => {
    it("stores and matches the landing session pathname", () => {
        mockSessionStorage();

        storeLandingSessionPath("/en/compress");

        expect(readLandingSessionPath()).toBe("/en/compress");
        expect(isStoredLandingSessionPath("/en/compress")).toBe(true);
        expect(isStoredLandingSessionPath("/en/merge")).toBe(false);
    });

    it("clears the stored landing session pathname", () => {
        mockSessionStorage();

        storeLandingSessionPath("/fr/split");
        clearLandingSessionPath();

        expect(readLandingSessionPath()).toBeNull();
    });

    it("tolerates unavailable session storage", () => {
        expect(readLandingSessionPath()).toBeNull();
        expect(isStoredLandingSessionPath("/en/compress")).toBe(false);
    });
});
