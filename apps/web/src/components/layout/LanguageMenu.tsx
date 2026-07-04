import { Dialog } from "@base-ui/react/dialog";
import { RiCheckLine, RiCloseLine, RiTranslate2 } from "@remixicon/react";
import { useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { toolbarIconButtonClass } from "@/components/layout/ToolbarIconButton";
import { DEFAULT_LOCALE } from "@/lib/features/locales/constants/locales.constants";
import { localizePathname, resolveSupportedLocale } from "@/lib/features/locales/utils/locales.utils";
import type { SupportedLocale } from "@/lib/features/locales/types/locales.types";
import { isFromLandingLocation } from "@/utils/landingNavigation.utils";
import { isStoredLandingSessionPath, storeLandingSessionPath } from "@/utils/landingSession.utils";

const LANGUAGES = [
    { code: "en", label: "English" },
    { code: "fr", label: "Fran\u00e7ais" },
] as const satisfies readonly { code: SupportedLocale; label: string }[];

export function LanguageMenu() {
    const { t, i18n } = useTranslation();
    const { locale } = useParams({ strict: false });
    const navigate = useNavigate();
    const location = useRouterState({ select: (s) => s.location });
    const [open, setOpen] = useState(false);
    const currentLocale = resolveSupportedLocale(locale) ?? resolveSupportedLocale(i18n.resolvedLanguage) ?? DEFAULT_LOCALE;

    const switchLocale = (newLocale: SupportedLocale) => {
        const newPathname = localizePathname(location.pathname, newLocale);
        const isLandingSession = isFromLandingLocation(location.state) || isStoredLandingSessionPath(location.pathname);

        if (isLandingSession) {
            storeLandingSessionPath(newPathname);
        }

        // Close first so React batches this with navigate() in the same render pass,
        // avoiding the backdrop lingering over the new page.
        setOpen(false);
        navigate({
            to: newPathname + location.searchStr + location.hash,
            replace: true,
            state: isLandingSession ? { fromLanding: true } : undefined,
        });
    };

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger aria-label={t("nav.languageAriaLabel")} className={toolbarIconButtonClass}>
                <RiTranslate2 className="size-4" />
            </Dialog.Trigger>

            <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 duration-100 data-open:animate-in data-open:fade-in-0" />
                <Dialog.Popup className="fixed bottom-0 left-0 right-0 z-50 rounded-t-xl border-t border-app-border bg-app-surface-raised p-2 shadow-xl outline-none duration-150 data-open:animate-in data-open:slide-in-from-bottom-4 data-closed:animate-out data-closed:slide-out-to-bottom-4 sm:bottom-auto sm:left-auto sm:right-4 sm:top-12 sm:w-40 sm:rounded-lg sm:border sm:data-open:slide-in-from-bottom-0 sm:data-open:zoom-in-95 sm:data-closed:slide-out-to-bottom-0 sm:data-closed:zoom-out-95">
                    <div className="mb-1 flex items-center justify-between px-2 py-1.5">
                        <p className="text-[9px] font-medium uppercase tracking-widest text-app-text-subtle">{t("nav.languageLabel")}</p>
                        <Dialog.Close className="flex size-5 items-center justify-center rounded text-app-text-subtle outline-none transition-colors hover:text-app-text sm:hidden">
                            <RiCloseLine className="size-3.5" />
                        </Dialog.Close>
                    </div>
                    {LANGUAGES.map(({ code, label }) => (
                        <button
                            key={code}
                            type="button"
                            className={cn(
                                "flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2.5 text-[13px] font-medium outline-none transition-colors sm:py-1.5 sm:text-[12px]",
                                "text-muted-foreground hover:bg-app-border-subtle hover:text-foreground",
                            )}
                            onClick={() => switchLocale(code)}
                        >
                            <RiCheckLine className={cn("size-3.5 shrink-0 sm:size-3", currentLocale === code ? "text-brand" : "opacity-0")} />
                            {label}
                        </button>
                    ))}
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
