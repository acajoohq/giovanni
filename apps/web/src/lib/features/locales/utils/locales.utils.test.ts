import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_LOCALE } from "../constants/locales.constants";
import { isSupportedLocale, resolveInitialClientLocale, resolveSupportedLocale } from "./locales.utils";

function mockClientEnvironment({ lang, pathname }: { lang?: string; pathname?: string }) {
    vi.stubGlobal("document", {
        documentElement: { lang: lang ?? "" },
    });
    vi.stubGlobal("window", {
        location: { pathname: pathname ?? "/" },
    });
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("isSupportedLocale", () => {
    it("accepts configured locales", () => {
        expect(isSupportedLocale("en")).toBe(true);
        expect(isSupportedLocale("fr")).toBe(true);
    });

    it("rejects unknown locale codes", () => {
        expect(isSupportedLocale("de")).toBe(false);
        expect(isSupportedLocale("")).toBe(false);
    });
});

describe("resolveSupportedLocale", () => {
    it("returns supported locale codes", () => {
        expect(resolveSupportedLocale("en")).toBe("en");
        expect(resolveSupportedLocale("fr")).toBe("fr");
    });

    it("returns undefined for missing or unsupported values", () => {
        expect(resolveSupportedLocale(undefined)).toBeUndefined();
        expect(resolveSupportedLocale("es")).toBeUndefined();
    });
});

describe("resolveInitialClientLocale", () => {
    it("defaults when document is unavailable", () => {
        expect(resolveInitialClientLocale()).toBe(DEFAULT_LOCALE);
    });

    it("prefers the hydrated html lang attribute", () => {
        mockClientEnvironment({ lang: "fr", pathname: "/en/tools" });

        expect(resolveInitialClientLocale()).toBe("fr");
    });

    it("normalizes the html lang attribute before resolving", () => {
        mockClientEnvironment({ lang: "  FR  ", pathname: "/en/tools" });

        expect(resolveInitialClientLocale()).toBe("fr");
    });

    it("falls back to the first pathname segment when html lang is unsupported", () => {
        mockClientEnvironment({ lang: "de", pathname: "/fr/compress" });

        expect(resolveInitialClientLocale()).toBe("fr");
    });

    it("normalizes the pathname locale segment before resolving", () => {
        mockClientEnvironment({ lang: "", pathname: "/FR/compress" });

        expect(resolveInitialClientLocale()).toBe("fr");
    });

    it("falls back to the default locale when no supported locale is found", () => {
        mockClientEnvironment({ lang: "de", pathname: "/tools" });

        expect(resolveInitialClientLocale()).toBe(DEFAULT_LOCALE);
    });
});
