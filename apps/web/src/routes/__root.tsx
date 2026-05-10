import { createRootRouteWithContext, HeadContent, Link, Scripts, useParams } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { AppShell } from "@/components/layout/AppShell";
import { createSeoMeta } from "@/lib/seo";
import type { RouterContext } from "@/router";
import appCss from "@/styles/app.css?url";

export const Route = createRootRouteWithContext<RouterContext>()({
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
    // This only triggers for truly malformed paths that bypass $locale entirely.
    // It renders outside RootComponent so it must be self-contained.
    notFoundComponent: RootNotFoundPage,
});

function RootComponent() {
    const { i18n } = Route.useRouteContext();
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

/**
 * Standalone fallback — renders outside RootComponent (no I18nextProvider,
 * no AppShell). Must not call useTranslation() or any router context hook.
 */
function RootNotFoundPage() {
    return (
        <html className="dark bg-[#0a0a0a] antialiased">
            <head>
                <HeadContent />
            </head>
            <body>
                <main className="mx-auto max-w-lg p-8">
                    <h1 className="text-2xl font-semibold tracking-tight text-white">Not found</h1>
                    <Link className="mt-4 inline-flex text-[#eb5a3f] hover:underline" to="/">
                        Back home
                    </Link>
                </main>
                <Scripts />
            </body>
        </html>
    );
}
