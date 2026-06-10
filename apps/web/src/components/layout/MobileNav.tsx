import { Dialog } from "@base-ui/react/dialog";
import { RiCloseLine, RiFileZipLine, RiImage2Line, RiImageLine, RiMoreFill, RiScissorsCutLine, RiSortAsc, RiStackLine } from "@remixicon/react";
import { Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const BOTTOM_TAB_ITEMS = [
    { key: "compress", icon: RiFileZipLine, to: "/$locale/compress" as const },
    { key: "split", icon: RiScissorsCutLine, to: "/$locale/split" as const },
    { key: "merge", icon: RiStackLine, to: "/$locale/merge" as const },
    { key: "organize", icon: RiSortAsc, to: "/$locale/organize" as const },
] as const;

const MORE_ITEMS = [
    { key: "extractImages", icon: RiImageLine, to: "/$locale/extract-images" as const },
    { key: "pdfToJpg", icon: RiImage2Line, to: "/$locale/pdf-to-jpg" as const },
] as const;

export function MobileNav() {
    const { t } = useTranslation();
    const { locale = "en" } = useParams({ strict: false });
    const [open, setOpen] = useState(false);

    return (
        <>
            <nav className="app-mobile-nav fixed bottom-0 left-0 right-0 z-30 flex h-16 items-stretch border-t border-app-border/70 bg-app-surface-raised/95 backdrop-blur-2xl supports-[backdrop-filter]:bg-app-surface-raised/80 sm:hidden">
                {BOTTOM_TAB_ITEMS.map(({ key, icon: Icon, to }) => (
                    <Link
                        key={to}
                        className="flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium tracking-[-0.01em] text-app-text-subtle transition-colors hover:text-app-text [&.active]:text-brand"
                        params={{ locale }}
                        to={to}
                    >
                        <Icon className="size-5" />
                        <span>{t(`nav.${key}`)}</span>
                    </Link>
                ))}

                <button
                    type="button"
                    className="flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium tracking-[-0.01em] text-app-text-subtle transition-colors hover:text-app-text"
                    onClick={() => setOpen(true)}
                >
                    <RiMoreFill className="size-5" />
                    <span>{t("nav.more")}</span>
                </button>
            </nav>

            <Dialog.Root open={open} onOpenChange={setOpen}>
                <Dialog.Portal>
                    <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40 duration-150 data-open:animate-in data-open:fade-in-0" />
                    <Dialog.Popup className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-app-border bg-app-surface-raised p-2 shadow-xl outline-none duration-200 data-open:animate-in data-open:slide-in-from-bottom-4 data-closed:animate-out data-closed:slide-out-to-bottom-4">
                        <div className="mb-2 flex items-center justify-between px-2 py-1.5">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-app-text-subtle">{t("nav.moreTools")}</p>
                            <Dialog.Close
                                aria-label={t("nav.close")}
                                className="flex size-6 items-center justify-center rounded text-app-text-subtle outline-none transition-colors hover:text-app-text"
                            >
                                <RiCloseLine className="size-4" />
                            </Dialog.Close>
                        </div>
                        <div className="grid grid-cols-2 gap-1 pb-2">
                            {MORE_ITEMS.map(({ key, icon: Icon, to }) => (
                                <Link
                                    key={to}
                                    className={cn(
                                        "flex items-center gap-3 rounded-xl px-4 py-4 text-[14px] font-medium text-app-text-subtle",
                                        "transition-colors hover:bg-app-border-subtle hover:text-app-text [&.active]:bg-app-control [&.active]:text-app-text",
                                    )}
                                    params={{ locale }}
                                    to={to}
                                    onClick={() => setOpen(false)}
                                >
                                    <Icon className="size-5 shrink-0" />
                                    {t(`nav.${key}`)}
                                </Link>
                            ))}
                        </div>
                    </Dialog.Popup>
                </Dialog.Portal>
            </Dialog.Root>
        </>
    );
}
