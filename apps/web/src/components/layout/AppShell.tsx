import { RiFilePdfLine, RiInformationLine } from "@remixicon/react";
import { Link, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AboutDialog } from "@/components/dialogs/AboutDialog";
import { LanguageMenu } from "@/components/layout/LanguageMenu";

export function AppShell() {
    const { t } = useTranslation();
    const [aboutOpen, setAboutOpen] = useState(false);

    const navigationItems = [
        { label: t("nav.compress"), to: "/compress" },
        { label: t("nav.split"), to: "/split" },
        { label: t("nav.merge"), to: "/merge" },
        { label: t("nav.organize"), to: "/organize" },
        { label: t("nav.extractImages"), to: "/extract-images" },
        { label: t("nav.pdfToJpg"), to: "/pdf-to-jpg" },
    ] as const;

    return (
        <div className="flex h-dvh w-screen min-w-0 flex-col overflow-hidden bg-app-bg font-sans text-neutral-200">
            <header className="z-20 flex h-auto shrink-0 flex-col gap-2 border-b border-app-border-subtle bg-app-surface-raised px-3 py-2 shadow-sm sm:h-12 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-8">
                    <div className="flex items-center gap-2 text-[13px] font-medium tracking-tight text-white">
                        <RiFilePdfLine className="size-4 text-brand" />
                        Giovanni
                    </div>
                    <nav className="flex min-w-0 items-center gap-1 overflow-x-auto">
                        {navigationItems.map((item) => (
                            <Link
                                key={item.to}
                                className="shrink-0 rounded-md px-3 py-1.5 text-[11px] font-medium text-neutral-500 transition-all hover:text-white [&.active]:bg-app-border-subtle [&.active]:text-white"
                                to={item.to}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="absolute right-3 top-2 flex items-center gap-1 sm:static">
                    <LanguageMenu />
                    <button
                        aria-label={t("nav.aboutAriaLabel")}
                        className="flex size-7 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-app-border-subtle hover:text-white"
                        onClick={() => setAboutOpen(true)}
                        type="button"
                    >
                        <RiInformationLine className="size-4" />
                    </button>
                </div>
            </header>

            <main className="relative min-h-0 flex-1 overflow-hidden">
                <Outlet />
            </main>

            <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
        </div>
    );
}
