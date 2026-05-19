import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./en";
import { fr } from "./fr";
import { DEFAULT_LOCALE } from "./constants/locales.constants";
import { resolveInitialClientLocale, resolveSupportedLocale } from "./utils/locales.utils";

const resources = {
    en: { translation: en },
    fr: { translation: fr },
};

const baseConfig = {
    resources,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
} as const;

// Client singleton — initialized once, safe (single user, no concurrency)
const clientI18n = i18next.createInstance();
export const i18nReady = clientI18n.use(initReactI18next).init({
    ...baseConfig,
    lng: resolveInitialClientLocale(),
});
export default clientI18n;

/**
 * SSR factory: creates a fresh, isolated i18n instance per request.
 * Resources are bundled so initialization is synchronous — no backend needed.
 */
export function createI18nInstance(locale = DEFAULT_LOCALE) {
    const instance = i18next.createInstance();
    instance.use(initReactI18next).init({
        ...baseConfig,
        lng: resolveSupportedLocale(locale) ?? DEFAULT_LOCALE,
    });
    return instance;
}
