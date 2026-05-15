import { Dialog } from "@base-ui/react/dialog";
import { RiCheckLine, RiCloseLine, RiTranslate2 } from "@remixicon/react";
import { useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
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
    const [open, setOpen] = useState(false);

    const switchLocale = (newLocale: string) => {
        // Replace the current locale segment in the pathname with the new one
        // e.g. /en/compress -> /fr/compress
        const newPathname = location.pathname.replace(new RegExp(`^/${locale}(/|$)`), `/${newLocale}$1`);
        navigate({ to: newPathname + location.searchStr + location.hash, replace: true });
        setOpen(false);
    };

    const current = locale ?? i18n.resolvedLanguage ?? "en";

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger
                aria-label={t("nav.languageAriaLabel")}
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-app-border-subtle hover:text-foreground"
            >
                <RiTranslate2 className="size-4" />
            </Dialog.Trigger>

            <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
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
                            <RiCheckLine className={cn("size-3.5 shrink-0 sm:size-3", current.startsWith(code) ? "text-brand" : "opacity-0")} />
                            {label}
                        </button>
                    ))}
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
