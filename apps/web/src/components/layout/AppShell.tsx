import { RiFilePdfLine, RiInformationLine } from "@remixicon/react";
import { Link, Outlet, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AboutDialog } from "@/components/dialogs/AboutDialog";
import { LanguageMenu } from "@/components/layout/LanguageMenu";
import { ToolbarIconButton } from "@/components/layout/ToolbarIconButton";
import { ModeToggle } from "@/components/theme/ModeToggle";
import { useTauriStartup } from "@/hooks/useTauriStartup";
import { useIsDesktopMacOS } from "@/lib/desktop/hooks/useIsDesktopMacOS";
import { cn } from "@/lib/utils";

const NAV_LINK_CLASS =
    "shrink-0 rounded-[5px] text-[12px] font-medium leading-none tracking-[-0.01em] text-app-text-subtle transition-colors hover:text-app-text [&.active]:bg-app-control/70 [&.active]:text-app-text";

export function AppShell() {
    const { t } = useTranslation();
    const [aboutOpen, setAboutOpen] = useState(false);
    const { locale = "en" } = useParams({ strict: false });
    const isMacDesktop = useIsDesktopMacOS();

    useTauriStartup();

    const navigationItems = [
        { label: t("nav.compress"), to: "/$locale/compress" as const },
        { label: t("nav.split"), to: "/$locale/split" as const },
        { label: t("nav.merge"), to: "/$locale/merge" as const },
        { label: t("nav.organize"), to: "/$locale/organize" as const },
        { label: t("nav.extractImages"), to: "/$locale/extract-images" as const },
        { label: t("nav.pdfToJpg"), to: "/$locale/pdf-to-jpg" as const },
    ];

    const nav = (
        <nav className="app-toolbar-nav flex max-w-[min(100vw-12rem,42rem)] min-w-0 items-center gap-0.5 overflow-x-auto">
            {navigationItems.map((item) => (
                <Link key={item.to} className={NAV_LINK_CLASS} params={{ locale }} to={item.to}>
                    {item.label}
                </Link>
            ))}
        </nav>
    );

    const actions = (
        <div className="flex shrink-0 items-center gap-0.5">
            <ModeToggle />
            <LanguageMenu />
            <ToolbarIconButton aria-label={t("nav.aboutAriaLabel")} onClick={() => setAboutOpen(true)}>
                <RiInformationLine className="size-4" />
            </ToolbarIconButton>
        </div>
    );

    const brand = (
        <div className="app-toolbar-brand flex shrink-0 items-center gap-2">
            <div className="flex size-[1.375rem] shrink-0 items-center justify-center rounded-[5px] bg-brand/12 ring-1 ring-brand/20">
                <RiFilePdfLine className="size-3 text-brand" />
            </div>
            <span className="text-[13px] font-semibold leading-none tracking-[-0.02em] text-app-text">Giovanni</span>
        </div>
    );

    return (
        <div className="flex h-dvh w-screen min-w-0 flex-col overflow-hidden bg-app-bg font-sans text-app-text">
            <header
                className={cn(
                    "app-toolbar z-20 shrink-0 bg-app-surface-raised/90 backdrop-blur-2xl supports-[backdrop-filter]:bg-app-surface-raised/75",
                    isMacDesktop
                        ? "desktop-titlebar relative flex h-[var(--app-toolbar-height)] items-center pl-[var(--app-macos-traffic-inset)] pr-[var(--app-toolbar-padding-x)]"
                        : "flex h-auto flex-col gap-2 border-b border-app-border/70 px-3 py-2 sm:h-[var(--app-toolbar-height)] sm:flex-row sm:items-center sm:justify-between sm:px-4",
                )}
            >
                {isMacDesktop ? (
                    <>
                        <div aria-hidden className="absolute inset-0 z-0" data-tauri-drag-region />
                        <div className="pointer-events-none relative z-10 flex min-w-0 flex-1 items-center self-stretch">{brand}</div>
                        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                            <div className="pointer-events-auto max-w-full px-2" data-tauri-drag-region={false}>
                                {nav}
                            </div>
                        </div>
                        <div className="pointer-events-none relative z-10 flex min-w-0 flex-1 items-center justify-end self-stretch">
                            <div className="pointer-events-auto" data-tauri-drag-region={false}>
                                {actions}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
                            {brand}
                            {nav}
                        </div>
                        <div className="absolute right-3 top-2 sm:static">{actions}</div>
                    </>
                )}
            </header>

            <main className="relative min-h-0 flex-1 overflow-hidden">
                <Outlet />
            </main>

            <AboutDialog onClose={() => setAboutOpen(false)} open={aboutOpen} />
        </div>
    );
}
