import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "@/locales/en";
import { fr } from "@/locales/fr";

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
    lng: "en",
});
export default clientI18n;

/**
 * SSR factory: creates a fresh, isolated i18n instance per request.
 * Resources are bundled so initialization is synchronous — no backend needed.
 */
export function createI18nInstance(locale = "en") {
    const instance = i18next.createInstance();
    instance.use(initReactI18next).init({
        ...baseConfig,
        lng: locale,
    });
    return instance;
}
