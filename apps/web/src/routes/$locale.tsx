import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const SUPPORTED_LOCALES = ["en", "fr"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export function isSupportedLocale(locale: string): locale is SupportedLocale {
    return (SUPPORTED_LOCALES as readonly string[]).includes(locale);
}

export const Route = createFileRoute("/$locale")({
    beforeLoad: async ({ params, context }) => {
        if (!isSupportedLocale(params.locale)) {
            throw redirect({ to: "/$locale", params: { locale: "en" }, replace: true });
        }
        // Mutate only the request-scoped instance from router context —
        // safe for concurrent SSR (each request has its own instance).
        await context.i18n.changeLanguage(params.locale);
    },
    component: LocaleLayout,
});

function LocaleLayout() {
    const { locale } = Route.useParams();
    const { i18n } = useTranslation();

    // Client-side: keep language in sync when navigating between locales
    useEffect(() => {
        if (i18n.language !== locale) {
            i18n.changeLanguage(locale);
        }
    }, [locale, i18n]);

    return <Outlet />;
}
