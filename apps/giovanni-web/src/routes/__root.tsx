/// <reference types="vite/client" />

import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { createSeoMeta } from "../lib/seo";
import appCss from "../styles/app.css?url";

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
            <Outlet />
        </RootDocument>
    );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <html className="min-h-screen scroll-smooth bg-white motion-reduce:scroll-auto antialiased" lang="en">
            <head>
                <HeadContent />
            </head>
            <body className="min-h-screen text-neutral-900">
                {children}
                <Scripts />
            </body>
        </html>
    );
}

function NotFoundPage() {
    return (
        <main className="mx-auto max-w-lg p-8" id="main-content">
            <p className="text-sm uppercase tracking-wide text-neutral-500">Not found</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">This page does not exist</h1>
            <a className="mt-6 inline-flex text-neutral-950 underline underline-offset-4 hover:text-neutral-600" href="/">
                Back home
            </a>
        </main>
    );
}
