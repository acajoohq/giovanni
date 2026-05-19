import { createFileRoute, redirect } from "@tanstack/react-router";

import { DEFAULT_LOCALE } from "@/lib/features/locales/constants/locales.constants";
import { resolveSupportedLocale } from "@/lib/features/locales/utils/locales.utils";

export const Route = createFileRoute("/")({
    beforeLoad: () => {
        const browserLocale = typeof navigator !== "undefined" ? navigator.language.slice(0, 2).toLowerCase() : undefined;
        const locale = resolveSupportedLocale(browserLocale) ?? DEFAULT_LOCALE;

        throw redirect({ to: "/$locale", params: { locale }, replace: true });
    },
});
