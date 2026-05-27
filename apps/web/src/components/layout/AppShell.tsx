import { RiFilePdfLine, RiInformationLine } from "@remixicon/react";
import { Link, Outlet, useParams } from "@tanstack/react-router";
import { useState, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { AboutDialog } from "@/components/dialogs/AboutDialog";
import { LanguageMenu } from "@/components/layout/LanguageMenu";
import { ToolbarIconButton } from "@/components/layout/ToolbarIconButton";
import { ModeToggle } from "@/components/theme/ModeToggle";
import { useTauriStartup } from "@/hooks/useTauriStartup";
import { cn } from "@/lib/utils";
import { isTauriMacOs } from "@/utils/tauri.utils";

function useTauriMacOs(): boolean {
    return useSyncExternalStore(
        () => () => {},
        () => isTauriMacOs(),
        () => false,
    );
}

const NAV_LINK_CLASS =
    "shrink-0 rounded-[6px] px-3 py-1 text-[12px] font-medium tracking-[-0.01em] text-app-text-subtle transition-[color,background-color,box-shadow] hover:text-app-text [&.active]:bg-app-control [&.active]:text-app-text [&.active]:shadow-skeuo-sm [&.active]:ring-1 [&.active]:ring-app-border/80";

export function AppShell() {
    const { t } = useTranslation();
    const [aboutOpen, setAboutOpen] = useState(false);
    const { locale = "en" } = useParams({ strict: false });
    const isMacDesktop = useTauriMacOs();

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
        <nav className="app-toolbar-nav flex max-w-full min-w-0 items-center gap-0.5 overflow-x-auto">
            {navigationItems.map((item) => (
                <Link key={item.to} className={NAV_LINK_CLASS} data-tauri-drag-region={isMacDesktop ? false : undefined} params={{ locale }} to={item.to}>
                    {item.label}
                </Link>
            ))}
        </nav>
    );

    const actions = (
        <div
            className="app-toolbar-actions flex shrink-0 items-center gap-0.5 rounded-[8px] p-0.5 ring-1 ring-app-border/50"
            data-tauri-drag-region={isMacDesktop ? false : undefined}
        >
            <ModeToggle />
            <LanguageMenu />
            <ToolbarIconButton aria-label={t("nav.aboutAriaLabel")} onClick={() => setAboutOpen(true)}>
                <RiInformationLine className="size-4" />
            </ToolbarIconButton>
        </div>
    );

    const brand = (
        <div className="flex shrink-0 items-center gap-2.5">
            <div className="flex size-6 items-center justify-center rounded-[6px] bg-brand/12 ring-1 ring-brand/20">
                <RiFilePdfLine className="size-3.5 text-brand" />
            </div>
            <span className="text-[13px] font-semibold tracking-[-0.02em] text-app-text">Giovanni</span>
        </div>
    );

    return (
        <div className="flex h-dvh w-screen min-w-0 flex-col overflow-hidden bg-app-bg font-sans text-app-text">
            <header
                className={cn(
                    "app-toolbar z-20 shrink-0 border-b border-app-border/70 bg-app-surface-raised/90 backdrop-blur-2xl supports-[backdrop-filter]:bg-app-surface-raised/75",
                    isMacDesktop
                        ? "desktop-titlebar grid h-[var(--app-toolbar-height)] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 pl-[var(--app-macos-traffic-inset)] pr-3"
                        : "flex h-auto flex-col gap-2 px-3 py-2 sm:h-[var(--app-toolbar-height)] sm:flex-row sm:items-center sm:justify-between sm:px-4",
                )}
            >
                {isMacDesktop ? (
                    <>
                        <div className="flex min-w-0 items-center" data-tauri-drag-region>
                            {brand}
                        </div>
                        {nav}
                        <div className="flex justify-end">{actions}</div>
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
