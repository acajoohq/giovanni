import { RiFilePdfLine, RiInformationLine } from "@remixicon/react";
import { Link, Outlet, useParams } from "@tanstack/react-router";
import { useState, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { AboutDialog } from "@/components/dialogs/AboutDialog";
import { ModeToggle } from "@/components/theme/ModeToggle";
import { LanguageMenu } from "@/components/layout/LanguageMenu";
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

export function AppShell() {
    const { t } = useTranslation();
    const [aboutOpen, setAboutOpen] = useState(false);
    const { locale = "en" } = useParams({ strict: false });
    const isMacDesktop = useTauriMacOs();

    // Handle OS context menu launches (desktop app only – no-op in browser)
    useTauriStartup();

    const navigationItems = [
        { label: t("nav.compress"), to: "/$locale/compress" as const },
        { label: t("nav.split"), to: "/$locale/split" as const },
        { label: t("nav.merge"), to: "/$locale/merge" as const },
        { label: t("nav.organize"), to: "/$locale/organize" as const },
        { label: t("nav.extractImages"), to: "/$locale/extract-images" as const },
        { label: t("nav.pdfToJpg"), to: "/$locale/pdf-to-jpg" as const },
    ];

    return (
        <div className="flex h-dvh w-screen min-w-0 flex-col overflow-hidden bg-app-bg font-sans text-app-text">
            <header
                className={cn(
                    "z-20 flex shrink-0 items-center gap-3 border-b border-app-border-subtle bg-app-surface-raised",
                    isMacDesktop
                        ? "desktop-titlebar h-[52px] pl-[4.75rem] pr-3 backdrop-blur-xl supports-[backdrop-filter]:bg-app-surface-raised/80"
                        : "h-auto flex-col gap-2 px-3 py-2 shadow-sm sm:h-12 sm:flex-row sm:items-center sm:justify-between sm:px-5",
                )}
            >
                <div
                    className={cn(
                        "flex min-w-0 items-center",
                        isMacDesktop ? "gap-4" : "min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-8",
                    )}
                    data-tauri-drag-region={isMacDesktop ? true : undefined}
                >
                    <div className="flex shrink-0 items-center gap-2 text-[13px] font-semibold tracking-tight text-foreground">
                        <RiFilePdfLine className="size-4 text-brand" />
                        Giovanni
                    </div>

                    <nav
                        className={cn(
                            "flex min-w-0 items-center gap-0.5 overflow-x-auto",
                            isMacDesktop && "rounded-[0.4375rem] bg-app-border-subtle/70 p-0.5",
                        )}
                    >
                        {navigationItems.map((item) => (
                            <Link
                                key={item.to}
                                className={cn(
                                    "shrink-0 rounded-md px-2.5 py-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground [&.active]:text-foreground",
                                    isMacDesktop
                                        ? "[&.active]:bg-app-control [&.active]:shadow-sm dark:[&.active]:bg-app-control"
                                        : "px-3 py-1.5 text-[11px] [&.active]:bg-app-border-subtle",
                                )}
                                data-tauri-drag-region={isMacDesktop ? false : undefined}
                                params={{ locale }}
                                to={item.to}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div
                    className={cn(
                        "flex items-center gap-1",
                        isMacDesktop ? "ml-auto shrink-0" : "absolute right-3 top-2 sm:static",
                    )}
                    data-tauri-drag-region={isMacDesktop ? false : undefined}
                >
                    <ModeToggle />
                    <LanguageMenu />
                    <button
                        aria-label={t("nav.aboutAriaLabel")}
                        className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-app-border-subtle hover:text-foreground"
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

            <AboutDialog onClose={() => setAboutOpen(false)} open={aboutOpen} />
        </div>
    );
}
