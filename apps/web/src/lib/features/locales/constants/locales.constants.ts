export const SUPPORTED_LOCALES = ["en", "fr"] as const;
export const DEFAULT_LOCALE = "en" satisfies (typeof SUPPORTED_LOCALES)[number];
