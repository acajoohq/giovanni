/// <reference types="vite/client" />

import type { ReactNode } from "react";
import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { createCanonicalLink, createSeoMeta } from "../lib/seo";
import appCss from "../styles/app.css?url";

const SITE_DESCRIPTION = "Giovanni is a calm, private PDF workspace for everyday document tasks.";

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
        links: [{ rel: "stylesheet", href: appCss }, createCanonicalLink(), { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" }],
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
        <html lang="en">
            <head>
                <HeadContent />
            </head>
            <body>
                <a className="skip-link" href="#main-content">
                    Skip to Main Content
                </a>
                <header className="site-header">
                    <a className="brand" href="/" aria-label="Giovanni Home">
                        <span className="brand-mark" aria-hidden="true">
                            G
                        </span>
                        <span translate="no">Giovanni</span>
                    </a>
                    <nav className="site-nav" aria-label="Main Navigation">
                        <a href="/#tools">Tools</a>
                        <a href="/#privacy">Privacy</a>
                        <a href="/#roadmap">Roadmap</a>
                    </nav>
                </header>
                {children}
                <footer className="site-footer">
                    <p>
                        <span translate="no">Giovanni</span> is being built as a simple, accessible home for private PDF work.
                    </p>
                </footer>
                <Scripts />
            </body>
        </html>
    );
}

function NotFoundPage() {
    return (
        <main className="page-shell simple-page" id="main-content">
            <p className="eyebrow">Page Not Found</p>
            <h1>This Page Is Not Available</h1>
            <p>The page may have moved. Return home to see what Giovanni is becoming.</p>
            <a className="button-link" href="/">
                Go Home
            </a>
        </main>
    );
}
