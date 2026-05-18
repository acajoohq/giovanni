import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "../constants/locales.constants";
import type { SupportedLocale } from "../types/locales.types";

export function isSupportedLocale(locale: string): locale is SupportedLocale {
    return (SUPPORTED_LOCALES as readonly string[]).includes(locale);
}

export function resolveSupportedLocale(locale: string | undefined): SupportedLocale | undefined {
    if (locale && isSupportedLocale(locale)) {
        return locale;
    }
}

export function resolveInitialClientLocale() {
    if (typeof document === "undefined") {
        return DEFAULT_LOCALE;
    }

    // prefer the hydrated route locale; "/" already handles navigator language redirects
    const hydratedRouteLocale = resolveSupportedLocale(document.documentElement.lang.trim().toLowerCase());
    const pathnameLocale = resolveSupportedLocale(window.location.pathname.split("/")[1]?.toLowerCase());

    return hydratedRouteLocale ?? pathnameLocale ?? DEFAULT_LOCALE;
}
