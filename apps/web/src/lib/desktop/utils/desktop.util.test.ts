import { afterEach, describe, expect, it, vi } from "vitest";
import { TAURI_INTERNALS_NAMESPACE } from "@/constants/desktop.constants";
import { getIsDesktopClient, getIsDesktopMacOS } from "@/lib/desktop/utils/desktop.util";

const invokeMock = vi.fn<(cmd: string, args?: Record<string, unknown>) => Promise<unknown>>();

function stubDesktopWindow(platform: string): void {
    vi.stubGlobal("window", { [TAURI_INTERNALS_NAMESPACE]: { invoke: invokeMock } });
    vi.stubGlobal("navigator", { platform });
}

describe("getIsDesktopClient", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("returns false without a window", () => {
        expect(getIsDesktopClient()).toBe(false);
    });

    it("returns false without Tauri internals", () => {
        vi.stubGlobal("window", {});
        expect(getIsDesktopClient()).toBe(false);
    });

    it("returns true when Tauri internals are present", () => {
        stubDesktopWindow("MacIntel");
        expect(getIsDesktopClient()).toBe(true);
    });
});

describe("getIsDesktopMacOS", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("returns false in the browser", () => {
        expect(getIsDesktopMacOS()).toBe(false);
    });

    it("returns true on macOS desktop", () => {
        stubDesktopWindow("MacIntel");
        expect(getIsDesktopMacOS()).toBe(true);
    });

    it("returns false on Windows desktop", () => {
        stubDesktopWindow("Win32");
        expect(getIsDesktopMacOS()).toBe(false);
    });
});
