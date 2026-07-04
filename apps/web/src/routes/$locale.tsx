import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { DEFAULT_LOCALE } from "@/lib/features/locales/constants/locales.constants";
import { isSupportedLocale } from "@/lib/features/locales/utils/locales.utils";

export const Route = createFileRoute("/$locale")({
    beforeLoad: async ({ params, context }) => {
        if (!isSupportedLocale(params.locale)) {
            throw redirect({ to: "/$locale", params: { locale: DEFAULT_LOCALE }, replace: true });
        }
        // Mutate only the request-scoped instance from router context —
        // safe for concurrent SSR (each request has its own instance).
        await context.i18n.changeLanguage(params.locale);
    },
    component: LocaleLayout,
    notFoundComponent: LocaleNotFoundPage,
});

function LocaleLayout() {
    return <Outlet />;
}

function LocaleNotFoundPage() {
    const { locale } = Route.useParams();
    const { t } = useTranslation();
    return (
        <main className="mx-auto max-w-lg p-8">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("notFound.title")}</h1>
            <Link className="mt-4 inline-flex text-brand hover:underline" to="/$locale" params={{ locale }}>
                {t("notFound.backHome")}
            </Link>
        </main>
    );
}
