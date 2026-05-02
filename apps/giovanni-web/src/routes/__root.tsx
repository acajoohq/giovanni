import { createRootRoute, HeadContent, Outlet, Scripts, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { createSeoMeta } from "../lib/seo";
import appCss from "../styles/app.css?url";
import { RiFilePdfLine, RiSettings3Line } from "@remixicon/react";

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
            <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0a0a0a] text-neutral-200 font-sans min-w-[1024px] min-h-[768px]">
                {/* Topbar - Squoosh / Teenage Engineering / Pro App Style */}
                <header className="h-12 flex items-center justify-between px-5 bg-[#141414] border-b border-[#1f1f1f] z-20 flex-shrink-0 shadow-sm">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2 text-white font-medium text-[13px] tracking-tight">
                            <RiFilePdfLine className="text-[#eb5a3f] size-4" />
                            Giovanni
                        </div>
                        <nav className="flex items-center gap-1">
                            <Link
                                to="/"
                                className="px-3 py-1.5 text-[11px] font-medium rounded-md text-neutral-500 hover:text-white transition-all [&.active]:bg-[#1f1f1f] [&.active]:text-white"
                            >
                                Compress
                            </Link>
                            <Link
                                to="/split"
                                className="px-3 py-1.5 text-[11px] font-medium rounded-md text-neutral-500 hover:text-white transition-all [&.active]:bg-[#1f1f1f] [&.active]:text-white"
                            >
                                Split
                            </Link>
                            <Link
                                to="/merge"
                                className="px-3 py-1.5 text-[11px] font-medium rounded-md text-neutral-500 hover:text-white transition-all [&.active]:bg-[#1f1f1f] [&.active]:text-white"
                            >
                                Merge
                            </Link>
                        </nav>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="size-7 flex items-center justify-center rounded-md hover:bg-[#1f1f1f] text-neutral-500 hover:text-white transition-colors">
                            <RiSettings3Line className="size-4" />
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-hidden relative">
                    <Outlet />
                </main>
            </div>
        </RootDocument>
    );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <html className="dark bg-[#0a0a0a] antialiased" lang="en">
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
    return (
        <main className="mx-auto max-w-lg p-8">
            <h1 className="text-2xl font-semibold tracking-tight text-white">Not found</h1>
            <Link className="mt-4 inline-flex text-[#eb5a3f] hover:underline" to="/">
                Back home
            </Link>
        </main>
    );
}
