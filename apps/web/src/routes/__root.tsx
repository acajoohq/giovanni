import { createRootRoute, HeadContent, Link, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { createSeoMeta } from "@/lib/seo";
import appCss from "@/styles/app.css?url";
import { AppShell } from "@/components/layout/AppShell";
import { ThemeProvider } from "@/components/theme-provider";

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
    return (
        <RootDocument>
            <AppShell />
        </RootDocument>
    );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <html className="antialiased" lang="en" suppressHydrationWarning>
            <head>
                <HeadContent />
            </head>
            <body>
                <ThemeProvider defaultTheme="system" storageKey="theme">
                    {children}
                </ThemeProvider>
                <Scripts />
            </body>
        </html>
    );
}

function NotFoundPage() {
    return (
        <main className="mx-auto max-w-lg p-8">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Not found</h1>
            <Link className="mt-4 inline-flex text-brand hover:underline" to="/">
                Back home
            </Link>
        </main>
    );
}
