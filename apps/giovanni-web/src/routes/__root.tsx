/// <reference types="vite/client" />

import { css } from "@linaria/core";
import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { clsx } from "clsx";
import type { ReactNode } from "react";
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
        <html className={htmlClassName} lang="en">
            <head>
                <HeadContent />
            </head>
            <body className={bodyClassName}>
                <a className={skipLinkClassName} href="#main-content">
                    Skip to Main Content
                </a>
                <header className={headerClassName}>
                    <a aria-label="Giovanni Home" className={homeLinkClassName} href="/">
                        <span aria-hidden="true" className={logoMarkClassName}>
                            G
                        </span>
                        <span translate="no">Giovanni</span>
                    </a>
                    <nav aria-label="Site navigation">
                        <a className={headerNavLinkClassName} href="https://github.com/MatteoGauthier/qpdf-wasm" rel="noreferrer" target="_blank">
                            GitHub
                        </a>
                    </nav>
                </header>
                {children}
                <footer aria-label="Site footer" className={footerClassName}>
                    <div className={footerGridClassName}>
                        <div>
                            <p className={footerBrandClassName} translate="no">
                                Giovanni
                            </p>
                            <p className={footerDescriptionClassName}>Simple PDF tools that run in your browser.</p>
                        </div>

                        <div>
                            <p className={footerLabelClassName}>Principles</p>
                            <ul className={principlesListClassName}>
                                <li className={clsx(principleClassName, principleYellowClassName)}>Local-first</li>
                                <li className={clsx(principleClassName, principleGreenClassName)}>Frugal</li>
                                <li className={clsx(principleClassName, principleCoralClassName)}>Commons</li>
                            </ul>
                        </div>

                        <nav aria-label="Project links">
                            <p className={footerLabelClassName}>Project</p>
                            <ul className={projectLinksListClassName}>
                                <li>
                                    <a className={footerLinkClassName} href="https://github.com/MatteoGauthier/qpdf-wasm" rel="noreferrer" target="_blank">
                                        Source code
                                    </a>
                                </li>
                                <li>
                                    <a className={footerLinkClassName} href="https://github.com/qpdf/qpdf" rel="noreferrer" target="_blank">
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
        <main className={notFoundMainClassName} id="main-content">
            <p className={notFoundEyebrowClassName}>Page Not Found</p>
            <h1 className={notFoundTitleClassName}>This Page Is Not Available</h1>
            <p className={notFoundDescriptionClassName}>The page may have moved. Return home to continue.</p>
            <a className={notFoundLinkClassName} href="/">
                Go Home
            </a>
        </main>
    );
}

const focusRing = `
    outline: 3px solid #1c1917;
    outline-offset: 4px;
`;

const htmlClassName = css`
    scroll-behavior: smooth;

    @media (prefers-reduced-motion: reduce) {
        scroll-behavior: auto;
    }
`;

const bodyClassName = css`
    min-height: 100dvh;
    overflow-x: hidden;
    font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
    color: #1c1917;
    background: #f8f1dc;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
`;

const skipLinkClassName = css`
    position: fixed;
    top: 1rem;
    left: 1.5rem;
    z-index: 50;
    min-height: 2.75rem;
    padding: 0.75rem 1.25rem;
    font-weight: 700;
    color: #fafaf9;
    text-decoration: none;
    touch-action: manipulation;
    background: #1c1917;
    border-radius: 8px;
    transform: translateY(-6rem);
    transition: transform 200ms ease;

    &:focus-visible {
        ${focusRing}
        transform: translateY(0);
    }

    @media (prefers-reduced-motion: reduce) {
        transition: none;
    }
`;

const headerClassName = css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 80rem;
    padding: 0.75rem 1rem;
    margin: 0 auto;

    @media (min-width: 640px) {
        padding-right: 1.5rem;
        padding-left: 1.5rem;
    }

    @media (min-width: 1024px) {
        padding-right: 2rem;
        padding-left: 2rem;
    }
`;

const homeLinkClassName = css`
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.125rem;
    font-weight: 900;
    color: #1c1917;
    text-decoration: none;
    letter-spacing: 0;
    touch-action: manipulation;
    border-radius: 8px;

    &:focus-visible {
        ${focusRing}
    }
`;

const logoMarkClassName = css`
    display: grid;
    width: 2.5rem;
    height: 2.5rem;
    place-items: center;
    font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
    font-size: 1.125rem;
    color: #1c1917;
    background: #fff2a8;
    border: 1px solid #1c1917;
    border-radius: 6px;
    box-shadow: 2px 2px 0 #1c1917;
`;

const headerNavLinkClassName = css`
    font-size: 0.875rem;
    font-weight: 700;
    color: #78716c;
    text-decoration: none;
    transition: color 150ms ease;

    &:hover {
        color: #1c1917;
    }

    &:focus-visible {
        ${focusRing}
    }
`;

const footerClassName = css`
    width: 100%;
    max-width: 80rem;
    padding: 1rem 1rem 2.5rem;
    margin: 0 auto;

    @media (min-width: 640px) {
        padding-right: 1.5rem;
        padding-left: 1.5rem;
    }

    @media (min-width: 1024px) {
        padding-right: 2rem;
        padding-left: 2rem;
    }
`;

const footerGridClassName = css`
    display: grid;
    gap: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #1c1917;

    @media (min-width: 640px) {
        grid-template-columns: 1.1fr 0.9fr 0.9fr;
    }
`;

const footerBrandClassName = css`
    margin: 0;
    font-size: 1.125rem;
    font-weight: 900;
    line-height: 1.5rem;
    color: #1c1917;
`;

const footerDescriptionClassName = css`
    max-width: 24rem;
    margin: 0.5rem 0 0;
    font-size: 0.875rem;
    font-weight: 700;
    line-height: 1.5rem;
    color: #57534e;
`;

const footerLabelClassName = css`
    margin: 0;
    font-size: 0.75rem;
    font-weight: 900;
    line-height: 1rem;
    color: #78716c;
    text-transform: uppercase;
`;

const principlesListClassName = css`
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0;
    margin: 0.75rem 0 0;
    font-size: 0.75rem;
    font-weight: 900;
    line-height: 1;
    color: #292524;
    text-transform: uppercase;
    list-style: none;
`;

const principleClassName = css`
    padding: 0.5rem 0.75rem;
    border: 1px solid #1c1917;
    box-shadow: 2px 2px 0 #1c1917;
`;

const principleYellowClassName = css`
    background: #fff2a8;
`;

const principleGreenClassName = css`
    background: #ccebdc;
`;

const principleCoralClassName = css`
    background: #ffd2c8;
`;

const projectLinksListClassName = css`
    display: grid;
    gap: 0.5rem;
    padding: 0;
    margin: 0.75rem 0 0;
    font-size: 0.875rem;
    font-weight: 700;
    line-height: 1.25rem;
    list-style: none;
`;

const footerLinkClassName = css`
    color: inherit;
    text-decoration-line: underline;
    text-decoration-thickness: 2px;
    text-decoration-color: #a8a29e;
    text-underline-offset: 4px;

    &:hover {
        color: #57534e;
    }

    &:focus-visible {
        ${focusRing}
    }
`;

const notFoundMainClassName = css`
    width: 100%;
    max-width: 48rem;
    min-height: 60dvh;
    padding: 5rem 1.5rem;
    margin: 0 auto;

    @media (min-width: 1024px) {
        padding-right: 2rem;
        padding-left: 2rem;
    }
`;

const notFoundEyebrowClassName = css`
    margin: 0;
    font-size: 0.875rem;
    font-weight: 900;
    line-height: 1.25rem;
    color: #44403c;
    text-transform: uppercase;
    letter-spacing: 0;
`;

const notFoundTitleClassName = css`
    max-width: 56rem;
    margin: 1rem 0 0;
    font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
    font-size: 3rem;
    line-height: 1.25;
    color: #1c1917;
    text-wrap: balance;
    letter-spacing: 0;

    @media (min-width: 640px) {
        font-size: 3.75rem;
    }

    @media (min-width: 1024px) {
        font-size: 4.5rem;
    }
`;

const notFoundDescriptionClassName = css`
    margin: 1.5rem 0 0;
    line-height: 1.75rem;
    color: #57534e;
`;

const notFoundLinkClassName = css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 3rem;
    padding: 0.75rem 1.5rem;
    margin-top: 2rem;
    font-size: 1rem;
    font-weight: 900;
    color: #fafaf9;
    text-decoration: none;
    touch-action: manipulation;
    background: #1c1917;
    border-radius: 8px;
    box-shadow: 4px 4px 0 #f6cf62;

    &:focus-visible {
        ${focusRing}
    }
`;
