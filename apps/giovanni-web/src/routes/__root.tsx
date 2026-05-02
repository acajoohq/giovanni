/// <reference types="vite/client" />

import type { ReactNode } from "react";
import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { createSeoMeta } from "../lib/seo";
import appCss from "../styles/app.css?url";

const SITE_DESCRIPTION = "Giovanni is a clear, private PDF workspace for everyday document work.";

export const Route = createRootRoute({
    head: () => ({
        meta: [
            { charSet: "utf-8" },
            { name: "viewport", content: "width=device-width, initial-scale=1" },
            { name: "theme-color", content: "#f7efe2" },
            ...createSeoMeta({
                title: "Giovanni | Private PDF Tools",
                description: SITE_DESCRIPTION,
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
        <html lang="en" className="scroll-smooth motion-reduce:scroll-auto">
            <head>
                <HeadContent />
            </head>
            <body className="min-h-dvh overflow-x-hidden bg-stone-100 text-stone-950 antialiased">
                <a
                    className="fixed left-6 top-4 z-50 -translate-y-24 touch-manipulation rounded-full bg-stone-950 px-5 py-3 font-bold text-stone-50 transition-transform duration-200 focus-visible:translate-y-0 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-orange-900 motion-reduce:transition-none"
                    href="#main-content"
                >
                    Skip to Main Content
                </a>
                <header className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
                    <a
                        className="inline-flex touch-manipulation items-center gap-3 rounded-full text-lg font-bold tracking-[-0.02em] text-stone-950 no-underline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-orange-900"
                        href="/"
                        aria-label="Giovanni Home"
                    >
                        <span className="grid size-11 place-items-center rounded-full bg-stone-950 font-serif text-xl text-stone-50 shadow-sm" aria-hidden="true">
                            G
                        </span>
                        <span translate="no">Giovanni</span>
                    </a>
                    <nav className="flex flex-wrap gap-2" aria-label="Main Navigation">
                        <a
                            className="touch-manipulation rounded-full px-4 py-3 text-sm font-bold text-stone-600 no-underline hover:bg-stone-200 hover:text-stone-950 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-orange-900"
                            href="/#tools"
                        >
                            Tools
                        </a>
                        <a
                            className="touch-manipulation rounded-full px-4 py-3 text-sm font-bold text-stone-600 no-underline hover:bg-stone-200 hover:text-stone-950 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-orange-900"
                            href="/#privacy"
                        >
                            Privacy
                        </a>
                        <a
                            className="touch-manipulation rounded-full px-4 py-3 text-sm font-bold text-stone-600 no-underline hover:bg-stone-200 hover:text-stone-950 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-orange-900"
                            href="/#principles"
                        >
                            Principles
                        </a>
                    </nav>
                </header>
                {children}
                <footer className="mx-auto w-full max-w-6xl border-t border-stone-300 px-6 py-8 text-sm lg:px-8">
                    <p className="m-0 leading-7 text-stone-600">
                        <span translate="no">Giovanni</span> keeps PDF work simple, legible, and private.
                    </p>
                </footer>
                <Scripts />
            </body>
        </html>
    );
}

function NotFoundPage() {
    return (
        <main className="mx-auto min-h-[60dvh] w-full max-w-3xl px-6 pb-20 pt-20 lg:px-8" id="main-content">
            <p className="m-0 text-sm font-black uppercase leading-5 tracking-[0.22em] text-orange-900">Page Not Found</p>
            <h1 className="m-0 mt-4 max-w-4xl text-balance font-serif text-5xl leading-tight tracking-[-0.03em] text-stone-950 sm:text-6xl lg:text-7xl">
                This Page Is Not Available
            </h1>
            <p className="m-0 mt-6 leading-7 text-stone-600">The page may have moved. Return home to continue.</p>
            <a
                className="mt-8 inline-flex min-h-12 touch-manipulation items-center justify-center rounded-full bg-stone-950 px-6 py-3 text-base font-black text-stone-50 no-underline shadow-lg hover:bg-orange-900 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-orange-900"
                href="/"
            >
                Go Home
            </a>
        </main>
    );
}
