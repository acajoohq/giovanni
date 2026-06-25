import { useState } from "react";
import { RiCloseLine, RiFilePdfLine, RiGithubLine } from "@remixicon/react";
import { Trans, useTranslation } from "react-i18next";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/shadcn/Dialog";

interface AboutDialogProps {
    open: boolean;
    onClose: () => void;
}

const CONTRIBUTORS = [
    { name: "Edward Brunetiere", github: "P4tt4te", initials: "EB", color: "#4f8ef7" },
    { name: "Mattèo Gauthier", github: "matteogauthier", initials: "MG", color: "var(--brand)" },
] as const;

const APP_VERSION = import.meta.env.VITE_APP_VERSION;
const GIT_COMMIT = import.meta.env.VITE_GIT_COMMIT;
const GITHUB_REPO_URL = "https://github.com/acajoohq/giovanni";

function Avatar({ name, github, initials, color }: (typeof CONTRIBUTORS)[number]) {
    const [failed, setFailed] = useState(false);
    const fallbackBackground = `color-mix(in oklab, ${color} 12%, transparent)`;
    const fallbackBorder = `color-mix(in oklab, ${color} 25%, transparent)`;

    return (
        <div className="flex flex-col items-center gap-2.5">
            {failed ? (
                <div
                    className="flex size-12 items-center justify-center rounded-full border text-[13px] font-semibold"
                    style={{ backgroundColor: fallbackBackground, borderColor: fallbackBorder, color }}
                >
                    {initials}
                </div>
            ) : (
                <img
                    alt={name}
                    src={`https://github.com/${github}.png?size=96`}
                    className="size-12 rounded-full border border-foreground/10 bg-app-surface-muted"
                    onError={() => setFailed(true)}
                />
            )}
            <div className="text-center">
                <div className="text-[12px] font-medium leading-tight text-app-text">{name}</div>
                <a className="text-[11px] text-muted-foreground transition-colors hover:text-brand" href={`https://github.com/${github}`} rel="noopener noreferrer" target="_blank">
                    @{github}
                </a>
            </div>
        </div>
    );
}

export function AboutDialog({ open, onClose }: AboutDialogProps) {
    const { t } = useTranslation();

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent showCloseButton={false} className="max-w-[400px] gap-0 overflow-hidden p-0">
                <div className="relative px-6 pb-5 pt-7 text-center">
                    <DialogClose className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-md text-app-text-subtle outline-none transition-colors hover:bg-foreground/5 hover:text-app-text-muted">
                        <RiCloseLine className="size-4" />
                    </DialogClose>

                    <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl border border-brand/20 bg-brand/10">
                        <RiFilePdfLine className="size-5 text-brand" />
                    </div>
                    <DialogTitle className="text-[15px] font-semibold text-foreground">Giovanni</DialogTitle>
                    <p className="mt-1 text-[11px] text-muted-foreground">{t("about.tagline")}</p>
                    <a
                        className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-brand"
                        href={GITHUB_REPO_URL}
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        <RiGithubLine className="size-3.5" />
                        {t("about.githubLink")}
                    </a>
                </div>

                <div className="border-y border-foreground/5 bg-foreground/2 px-6 py-5">
                    <p className="mb-4 text-center text-[10px] font-medium uppercase tracking-widest text-app-text-subtle">{t("about.madeBy")}</p>
                    <div className="flex justify-center gap-10">
                        {CONTRIBUTORS.map((c) => (
                            <Avatar key={c.github} {...c} />
                        ))}
                    </div>
                </div>

                <div className="px-6 py-3.5" data-selectable-area>
                    <p className="text-balance text-center text-[11px] leading-relaxed text-app-text-subtle">
                        <Trans
                            i18nKey="about.poweredBy"
                            components={{
                                qpdf: (
                                    <a
                                        className="text-muted-foreground transition-colors hover:text-brand"
                                        href="https://github.com/qpdf/qpdf"
                                        rel="noopener noreferrer"
                                        target="_blank"
                                    >
                                        qpdf
                                    </a>
                                ),
                            }}
                        />
                    </p>
                    <p className="mt-2 text-center font-mono text-[9px] text-app-text-subtle">
                        v{APP_VERSION} · {GIT_COMMIT}
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
