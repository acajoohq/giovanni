import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { en } from "@/locales/en";
import { fr } from "@/locales/fr";

const instance = i18n.use(initReactI18next);

// LanguageDetector uses browser APIs (navigator, document) — skip on SSR
if (typeof window !== "undefined") {
    instance.use(LanguageDetector);
}

instance.init({
    resources: {
        en: { translation: en },
        fr: { translation: fr },
    },
    fallbackLng: "en",
    interpolation: {
        escapeValue: false,
    },
});

export default i18n;
