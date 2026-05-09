import { createRootRoute, HeadContent, Link, Scripts, useParams } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";
import { AppShell } from "@/components/layout/AppShell";
import i18n from "@/lib/i18n";
import { createSeoMeta } from "@/lib/seo";
import appCss from "@/styles/app.css?url";

export const Route = createRootRoute({
    head: () => ({
        meta: [
            { charSet: "utf-8" },
            { name: "viewport", content: "width=device-width, initial-scale=1" },
            ...createSeoMeta({
                title: "Giovanni",
                description: "PDF tools in your browser.",
            }),
        ],
        links: [
            { rel: "stylesheet", href: appCss },
            { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
        ],
    }),
    component: RootComponent,
    notFoundComponent: NotFoundPage,
});

function RootComponent() {
    const { locale = "en" } = useParams({ strict: false });
    return (
        <I18nextProvider i18n={i18n}>
            <RootDocument lang={locale}>
                <AppShell />
            </RootDocument>
        </I18nextProvider>
    );
}

function RootDocument({ children, lang }: Readonly<{ children: ReactNode; lang: string }>) {
    return (
        <html lang={lang} className="dark bg-[#0a0a0a] antialiased">
            <head>
                <HeadContent />
            </head>
            <body>
                {children}
                <Scripts />
            </body>
        </html>
    );
}

function NotFoundPage() {
    const { t } = useTranslation();
    return (
        <main className="mx-auto max-w-lg p-8">
            <h1 className="text-2xl font-semibold tracking-tight text-white">{t("notFound.title")}</h1>
            <Link className="mt-4 inline-flex text-[#eb5a3f] hover:underline" to="/">
                {t("notFound.backHome")}
            </Link>
        </main>
    );
}
