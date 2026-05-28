import { createRootRouteWithContext, HeadContent, Link, Scripts, useParams } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { AppShell } from "@/components/layout/AppShell";
import { DesktopDocumentClass } from "@/components/layout/DesktopDocumentClass";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { PendingFileProvider } from "@/providers/PendingFileProvider";
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
    errorComponent: RootErrorPage,
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
        <html lang={lang} className="antialiased" suppressHydrationWarning>
            <head>
                <HeadContent />
            </head>
            <body>
                <DesktopDocumentClass />
                <ThemeProvider defaultTheme="system" storageKey="theme">
                    <PendingFileProvider>{children}</PendingFileProvider>
                </ThemeProvider>
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
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Not found</h1>
                    <Link className="mt-4 inline-flex text-brand hover:underline" to="/">
                        Back home
                    </Link>
                </main>
                <Scripts />
            </body>
        </html>
    );
}

function RootErrorPage({ error }: Readonly<{ error: unknown }>) {
    const { locale = "en" } = useParams({ strict: false });
    const message = error instanceof Error ? error.message : "Unknown application error";

    return (
        <html className="dark bg-[#0a0a0a] antialiased">
            <head>
                <HeadContent />
            </head>
            <body>
                <main className="mx-auto max-w-lg p-8">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Something went wrong</h1>
                    <p className="mt-3 text-sm text-muted-foreground">{message}</p>
                    <Link className="mt-4 inline-flex text-brand hover:underline" to="/$locale" params={{ locale }}>
                        Back home
                    </Link>
                </main>
                <Scripts />
            </body>
        </html>
    );
}
