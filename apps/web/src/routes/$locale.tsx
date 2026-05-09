import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
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
    notFoundComponent: LocaleNotFoundPage,
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

function LocaleNotFoundPage() {
    const { locale } = Route.useParams();
    const { t } = useTranslation();
    return (
        <main className="mx-auto max-w-lg p-8">
            <h1 className="text-2xl font-semibold tracking-tight text-white">{t("notFound.title")}</h1>
            <Link
                className="mt-4 inline-flex text-[#eb5a3f] hover:underline"
                to="/$locale"
                params={{ locale }}
            >
                {t("notFound.backHome")}
            </Link>
        </main>
    );
}
