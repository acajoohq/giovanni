/// <reference types="vite/client" />

import { createRootRoute, HeadContent, Outlet, Scripts, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { createSeoMeta } from "../lib/seo";
import appCss from "../styles/app.css?url";
import { RiFilePdfLine, RiScissorsCutLine, RiFileZipLine, RiSettings3Line } from "@remixicon/react";

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
            <div className="flex h-screen bg-[#0a0a0a] text-neutral-200 font-sans">
                {/* Sidebar */}
                <aside className="w-64 border-r border-white/5 bg-[#141414] p-4 hidden md:flex flex-col gap-2 shadow-[4px_0_24px_rgba(0,0,0,0.2)] z-10">
                    <div className="px-3 py-4 mb-4">
                        <h1 className="text-xl font-medium text-white flex items-center gap-2">
                            <RiFilePdfLine className="text-[#eb5a3f] size-6" />
                            Giovanni
                        </h1>
                    </div>

                    <nav className="flex flex-col gap-1 flex-1">
                        <div className="text-[11px] font-medium text-neutral-500 px-3 pb-2 uppercase tracking-wider">Tools</div>
                        <Link
                            to="/"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors [&.active]:bg-[#2a2a2a] [&.active]:text-white [&.active]:shadow-skeuo-sm [&.active]:border [&.active]:border-black/50"
                        >
                            <RiFilePdfLine className="size-5" />
                            Merge PDF
                        </Link>
                        <Link
                            to="/split"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors [&.active]:bg-[#2a2a2a] [&.active]:text-white [&.active]:shadow-skeuo-sm [&.active]:border [&.active]:border-black/50"
                        >
                            <RiScissorsCutLine className="size-5" />
                            Split PDF
                        </Link>
                        <Link
                            to="/compress"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors [&.active]:bg-[#2a2a2a] [&.active]:text-white [&.active]:shadow-skeuo-sm [&.active]:border [&.active]:border-black/50"
                        >
                            <RiFileZipLine className="size-5" />
                            Compress PDF
                        </Link>
                    </nav>

                    <div className="mt-auto">
                        <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors w-full text-left">
                            <RiSettings3Line className="size-5" />
                            Settings
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto relative bg-[#0a0a0a]">
                    <Outlet />
                </main>
            </div>
        </RootDocument>
    );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <html className="dark min-h-screen scroll-smooth bg-background motion-reduce:scroll-auto antialiased" lang="en">
            <head>
                <HeadContent />
            </head>
            <body className="min-h-screen text-foreground bg-background">
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
