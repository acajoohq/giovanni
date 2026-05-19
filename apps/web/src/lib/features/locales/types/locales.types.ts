import { en } from "../en";
import type { SUPPORTED_LOCALES } from "../constants/locales.constants";

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export type DeepString<T> = {
    [K in keyof T]: T[K] extends Record<string, unknown> ? DeepString<T[K]> : string;
};

export type Translations = DeepString<typeof en>;
