import { Menu } from "@base-ui/react/menu";
import { RiCheckLine, RiTranslate2 } from "@remixicon/react";
import { useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const LANGUAGES = [
    { code: "en", label: "English" },
    { code: "fr", label: "Fran\u00e7ais" },
] as const;

export function LanguageMenu() {
    const { t, i18n } = useTranslation();
    const { locale = "en" } = useParams({ strict: false });
    const navigate = useNavigate();
    const location = useRouterState({ select: (s) => s.location });

    const switchLocale = (newLocale: string) => {
        // Replace the current locale segment in the pathname with the new one
        // e.g. /en/compress -> /fr/compress
        const newPathname = location.pathname.replace(new RegExp(`^/${locale}(/|$)`), `/${newLocale}$1`);
        navigate({ to: newPathname + location.searchStr + location.hash, replace: true });
    };

    const current = locale ?? i18n.resolvedLanguage ?? "en";

    return (
        <Menu.Root>
            <Menu.Trigger
                aria-label={t("nav.languageAriaLabel")}
                className="flex size-7 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-app-border-subtle hover:text-white"
            >
                <RiTranslate2 className="size-4" />
            </Menu.Trigger>

            <Menu.Portal>
                <Menu.Positioner side="bottom" align="end" sideOffset={6}>
                    <Menu.Popup className="z-50 min-w-[120px] overflow-hidden rounded-lg border border-app-border bg-app-surface-raised p-1 shadow-lg outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
                        <p className="px-2 py-1.5 text-[9px] font-medium uppercase tracking-widest text-neutral-600">{t("nav.languageLabel")}</p>
                        {LANGUAGES.map(({ code, label }) => (
                            <Menu.Item
                                key={code}
                                className={cn(
                                    "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[12px] font-medium outline-none transition-colors",
                                    "text-neutral-400 hover:bg-app-border-subtle hover:text-white",
                                    "data-highlighted:bg-app-border-subtle data-highlighted:text-white",
                                )}
                                onClick={() => switchLocale(code)}
                            >
                                <RiCheckLine className={cn("size-3 shrink-0", current.startsWith(code) ? "text-brand" : "opacity-0")} />
                                {label}
                            </Menu.Item>
                        ))}
                    </Menu.Popup>
                </Menu.Positioner>
            </Menu.Portal>
        </Menu.Root>
    );
}
