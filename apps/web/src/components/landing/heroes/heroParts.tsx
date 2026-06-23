import { RiArrowRightUpLine } from "@remixicon/react";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

/** Shared props every hero layout variant accepts. */
export interface HeroLayoutProps {
    locale: string;
    onStart: () => void;
    /** "overlay" pins the hero behind the app card; "static" flows it as a stacked section. */
    variant?: "overlay" | "static";
}

/** Positioning base shared by every variant: overlay (behind the card) vs static (stacked). */
export function heroRootClass(isOverlay: boolean) {
    return cn("px-6", isOverlay ? "absolute inset-0" : "relative min-h-full w-full py-20");
}

/** Soft brand glow. Position it per-variant via className (left/top/size/translate). */
export function HeroGlow({ className }: { className?: string }) {
    return (
        <div
            aria-hidden
            className={cn("pointer-events-none absolute rounded-full", className)}
            style={{ background: "radial-gradient(circle, rgba(235,90,63,0.12), transparent 60%)" }}
        />
    );
}

/** The Giovanni "G" brand mark — mirrors public/favicon.svg. */
export function GiovanniMark({ size = "lg", className }: { size?: "lg" | "sm"; className?: string }) {
    const box = size === "lg" ? "size-14 rounded-[1.125rem]" : "size-9 rounded-[0.7rem]";
    const glyph = size === "lg" ? "size-9" : "size-6";
    return (
        <span className={cn("inline-flex items-center justify-center shadow-skeuo", box, className)} style={{ background: "#1d1a16" }}>
            <svg aria-label="Giovanni" className={glyph} role="img" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M34 11c-11.05 0-20 8.95-20 20s8.95 20 20 20c4.96 0 9.52-1.81 13.02-4.82V29.5H33v8h5.92v4.08A12.04 12.04 0 0 1 34 42.66c-6.44 0-11.66-5.22-11.66-11.66S27.56 19.34 34 19.34c3.31 0 6.3 1.38 8.42 3.6l5.88-5.88A19.93 19.93 0 0 0 34 11Z"
                    fill="#f7efe2"
                />
            </svg>
        </span>
    );
}

/** Small uppercase eyebrow label shown above the headline. */
export function HeroEyebrow({ children }: { children: ReactNode }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-app-border bg-app-control px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-app-text-subtle shadow-skeuo-sm">
            <span aria-hidden className="size-1.5 rounded-full bg-brand" />
            {children}
        </span>
    );
}

/** Primary CTA — docks the live tool. */
export function HeroCta({ onStart, className }: { onStart: () => void; className?: string }) {
    const { t } = useTranslation();
    return (
        <button
            className={cn(
                "rounded-[9px] border border-brand-dark/60 bg-brand px-5 py-2.5 text-[13px] font-semibold text-white shadow-skeuo transition-colors hover:bg-brand-hover active:translate-y-px active:shadow-none",
                className,
            )}
            onClick={onStart}
            type="button"
        >
            {t("home.cta")}
        </button>
    );
}

export const TOOL_LINKS = [
    { key: "split", to: "/$locale/split" },
    { key: "merge", to: "/$locale/merge" },
    { key: "organize", to: "/$locale/organize" },
    { key: "extractImages", to: "/$locale/extract-images" },
    { key: "pdfToJpg", to: "/$locale/pdf-to-jpg" },
] as const;

/** Tool entrypoints as a row of buttons, linking to each tool route. */
export function HeroToolButtons({ locale, align = "center", className }: { locale: string; align?: "center" | "start"; className?: string }) {
    const { t } = useTranslation();
    return (
        <div className={cn("flex flex-wrap gap-2", align === "center" ? "justify-center" : "justify-start", className)}>
            {TOOL_LINKS.map((tool) => (
                <Link
                    className="rounded-[9px] border border-app-border bg-app-surface px-4 py-2 text-[13px] font-medium text-app-text-muted shadow-skeuo-sm transition-colors hover:bg-app-control-hover hover:text-app-text"
                    key={tool.key}
                    params={{ locale }}
                    to={tool.to}
                >
                    {t(`nav.${tool.key}` as const)}
                </Link>
            ))}
        </div>
    );
}

/** Secondary entrypoints to the other tools, as a wrapping chip row. */
export function HeroToolChips({ locale, align = "center", className }: { locale: string; align?: "center" | "start"; className?: string }) {
    const { t } = useTranslation();
    return (
        <nav className={cn("flex flex-col gap-3", align === "center" ? "items-center" : "items-start", className)}>
            <span className="text-[11px] uppercase tracking-[0.1em] text-app-text-subtle">{t("home.toolsLabel")}</span>
            <div className={cn("flex flex-wrap gap-1.5", align === "center" ? "justify-center" : "justify-start")}>
                {TOOL_LINKS.map((tool) => (
                    <Link
                        className="group flex items-center gap-1 rounded-full border border-app-border bg-app-surface px-3 py-1 text-[12px] font-medium text-app-text-muted shadow-skeuo-sm transition-colors hover:text-app-text"
                        key={tool.key}
                        params={{ locale }}
                        to={tool.to}
                    >
                        {t(`nav.${tool.key}` as const)}
                        <RiArrowRightUpLine className="size-3 opacity-40 transition-opacity group-hover:opacity-80" />
                    </Link>
                ))}
            </div>
        </nav>
    );
}
