/// <reference types="vite/client" />

import type { ReactNode } from "react";
import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { createSeoMeta } from "../lib/seo";
import appCss from "../styles/app.css?url";

const SITE_DESCRIPTION = "Giovanni is a frugal, local-first PDF workspace for everyday document work.";

export const Route = createRootRoute({
    head: () => ({
        meta: [
            { charSet: "utf-8" },
            { name: "viewport", content: "width=device-width, initial-scale=1" },
            { name: "theme-color", content: "#f8f1dc" },
            ...createSeoMeta({
                title: "Giovanni | Frugal PDF Tools",
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
            <body className="min-h-dvh overflow-x-hidden bg-[#f8f1dc] font-sans text-stone-950 antialiased">
                <a
                    className="fixed left-6 top-4 z-50 -translate-y-24 touch-manipulation rounded-[8px] bg-stone-950 px-5 py-3 font-bold text-stone-50 transition-transform duration-200 focus-visible:translate-y-0 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-stone-950 motion-reduce:transition-none"
                    href="#main-content"
                >
                    Skip to Main Content
                </a>
                <header className="mx-auto flex w-full max-w-7xl items-center px-4 py-3 sm:px-6 lg:px-8">
                    <a
                        className="inline-flex touch-manipulation items-center gap-3 rounded-[8px] text-lg font-black tracking-normal text-stone-950 no-underline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-stone-950"
                        href="/"
                        aria-label="Giovanni Home"
                    >
                        <span
                            className="grid size-11 place-items-center border border-stone-950 bg-[#fff2a8] font-serif text-xl text-stone-950 shadow-[3px_3px_0_#1c1917]"
                            aria-hidden="true"
                        >
                            G
                        </span>
                        <span translate="no">Giovanni</span>
                    </a>
                </header>
                {children}
                <footer className="mx-auto w-full max-w-7xl px-4 pb-10 pt-4 sm:px-6 lg:px-8" aria-label="Site footer">
                    <div className="grid gap-6 border-t border-stone-950 pt-6 sm:grid-cols-[1.1fr_0.9fr_0.9fr]">
                        <div>
                            <p className="m-0 text-lg font-black leading-6 text-stone-950" translate="no">
                                Giovanni
                            </p>
                            <p className="m-0 mt-2 max-w-sm text-sm font-bold leading-6 text-stone-600">Simple PDF tools that run in your browser.</p>
                        </div>

                        <div>
                            <p className="m-0 text-xs font-black uppercase leading-4 text-stone-500">Principles</p>
                            <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0 text-xs font-black uppercase leading-none text-stone-800">
                                <li className="border border-stone-950 bg-[#fff2a8] px-3 py-2 shadow-[2px_2px_0_#1c1917]">Local-first</li>
                                <li className="border border-stone-950 bg-[#ccebdc] px-3 py-2 shadow-[2px_2px_0_#1c1917]">Frugal</li>
                                <li className="border border-stone-950 bg-[#ffd2c8] px-3 py-2 shadow-[2px_2px_0_#1c1917]">Commons</li>
                            </ul>
                        </div>

                        <nav aria-label="Project links">
                            <p className="m-0 text-xs font-black uppercase leading-4 text-stone-500">Project</p>
                            <ul className="m-0 mt-3 grid list-none gap-2 p-0 text-sm font-bold leading-5">
                                <li>
                                    <a
                                        className="underline decoration-stone-400 decoration-2 underline-offset-4 hover:text-stone-600 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-stone-950"
                                        href="https://github.com/MatteoGauthier/qpdf-wasm"
                                        rel="noreferrer"
                                        target="_blank"
                                    >
                                        Source code
                                    </a>
                                </li>
                                <li>
                                    <a
                                        className="underline decoration-stone-400 decoration-2 underline-offset-4 hover:text-stone-600 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-stone-950"
                                        href="https://github.com/qpdf/qpdf"
                                        rel="noreferrer"
                                        target="_blank"
                                    >
                                        qpdf
                                    </a>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </footer>
                <Scripts />
            </body>
        </html>
    );
}

function NotFoundPage() {
    return (
        <main className="mx-auto min-h-[60dvh] w-full max-w-3xl px-6 pb-20 pt-20 lg:px-8" id="main-content">
            <p className="m-0 text-sm font-black uppercase leading-5 tracking-normal text-stone-700">Page Not Found</p>
            <h1 className="m-0 mt-4 max-w-4xl text-balance font-serif text-5xl leading-tight tracking-normal text-stone-950 sm:text-6xl lg:text-7xl">This Page Is Not Available</h1>
            <p className="m-0 mt-6 leading-7 text-stone-600">The page may have moved. Return home to continue.</p>
            <a
                className="mt-8 inline-flex min-h-12 touch-manipulation items-center justify-center rounded-[8px] bg-stone-950 px-6 py-3 text-base font-black text-stone-50 no-underline shadow-[4px_4px_0_#f6cf62] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-stone-950"
                href="/"
            >
                Go Home
            </a>
        </main>
    );
}
