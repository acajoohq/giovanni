import { RiFilePdfLine, RiInformationLine } from "@remixicon/react";
import { Link, Outlet, useParams, useRouter, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AboutDialog } from "@/components/dialogs/AboutDialog";
import { LanguageMenu } from "@/components/layout/LanguageMenu";
import { MobileNav } from "@/components/layout/MobileNav";
import { ToolbarIconButton } from "@/components/layout/ToolbarIconButton";
import { ModeToggle } from "@/components/theme/ModeToggle";
import { LandingHome } from "@/components/landing/LandingHome";
import { LANDING_TOOLS } from "@/components/landing/landingTool.registry";
import { useTauriStartup } from "@/hooks/useTauriStartup";
import { useIsDesktopMacOS } from "@/lib/desktop/hooks/useIsDesktopMacOS";
import { cn } from "@/lib/utils";
import { getLandingToolKeyFromPathname, isFromLandingLocation } from "@/utils/landingNavigation.utils";

const NAV_LINK_CLASS =
    "shrink-0 rounded-[5px] px-3 py-1 text-[12px] font-medium tracking-[-0.01em] text-app-text-subtle transition-[color,background-color,box-shadow] hover:text-app-text [&.active]:bg-app-control [&.active]:text-app-text";

export function AppShell() {
    const { t } = useTranslation();
    const [aboutOpen, setAboutOpen] = useState(false);
    const router = useRouter();
    const { locale = "en" } = useParams({ strict: false });
    const { fromLanding, pathname } = useRouterState({
        select: (state) => ({
            fromLanding: isFromLandingLocation(state.location.state),
            pathname: state.location.pathname,
        }),
    });
    const landingToolKey = getLandingToolKeyFromPathname(router, pathname, locale);
    const isMacDesktop = useIsDesktopMacOS();
    const isLandingIndex = pathname === router.buildLocation({ to: "/$locale", params: { locale } }).pathname;
    const showLandingSession = fromLanding && landingToolKey !== null;
    const showLandingHome = isLandingIndex || showLandingSession;

    useTauriStartup();

    const navigationItems = LANDING_TOOLS.map((tool) => ({
        label: t(`nav.${tool.key}` as const),
        to: tool.to,
    }));

    const nav = (
        <nav className="app-toolbar-nav hidden items-center gap-0.5 sm:flex sm:max-w-[min(100vw-12rem,42rem)]">
            {navigationItems.map((item) => {
                const toolPath = router.buildLocation({ to: item.to, params: { locale } }).pathname;

                return (
                    <Link key={item.to} className={cn(NAV_LINK_CLASS, pathname === toolPath && "active")} params={{ locale }} to={item.to}>
                        {item.label}
                    </Link>
                );
            })}
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
        <Link
            className="app-toolbar-brand pointer-events-auto flex shrink-0 items-center gap-2 rounded-[5px] transition-opacity hover:opacity-80"
            data-tauri-drag-region={false}
            params={{ locale }}
            to="/$locale"
        >
            <div className="flex size-[1.375rem] shrink-0 items-center justify-center rounded-[5px] bg-brand/12 ring-1 ring-brand/20">
                <RiFilePdfLine className="size-3 text-brand" />
            </div>
            <span className="text-[13px] font-semibold leading-none tracking-[-0.02em] text-app-text">Giovanni</span>
        </Link>
    );

    return (
        <div className="flex h-dvh w-screen min-w-0 flex-col overflow-hidden bg-app-bg font-sans text-app-text">
            <header
                className={cn(
                    "app-toolbar z-20 shrink-0 bg-app-surface-raised/90 backdrop-blur-2xl supports-[backdrop-filter]:bg-app-surface-raised/75",
                    isMacDesktop
                        ? "desktop-titlebar relative flex h-[var(--app-toolbar-height)] items-center pl-[var(--app-macos-traffic-inset)] pr-[var(--app-toolbar-padding-x)]"
                        : "flex h-[var(--app-toolbar-height)] items-center justify-between border-b border-app-border/70 px-3 sm:px-4",
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
                        <div className="flex min-w-0 flex-1 items-center gap-6">
                            {brand}
                            {nav}
                        </div>
                        {actions}
                    </>
                )}
            </header>

            <main className="relative min-h-0 flex-1 overflow-hidden pb-16 sm:pb-0">
                {showLandingHome ? <LandingHome initialTool={landingToolKey ?? undefined} startDocked={showLandingSession} /> : <Outlet />}
            </main>

            <MobileNav />
            <AboutDialog onClose={() => setAboutOpen(false)} open={aboutOpen} />
        </div>
    );
}
