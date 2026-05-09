import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";

const SUPPORTED_LOCALES = ["en", "fr"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export function isSupportedLocale(locale: string): locale is SupportedLocale {
    return (SUPPORTED_LOCALES as readonly string[]).includes(locale);
}

export const Route = createFileRoute("/$locale")({
    beforeLoad: async ({ params }) => {
        if (!isSupportedLocale(params.locale)) {
            throw redirect({ to: "/$locale", params: { locale: "en" }, replace: true });
        }
        await i18n.changeLanguage(params.locale);
    },
    component: LocaleLayout,
});

function LocaleLayout() {
    const { locale } = Route.useParams();
    const { i18n: i18nInstance } = useTranslation();

    useEffect(() => {
        if (i18nInstance.language !== locale) {
            i18nInstance.changeLanguage(locale);
        }
    }, [locale, i18nInstance]);

    return <Outlet />;
}
