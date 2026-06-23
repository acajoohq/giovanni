import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

/** Shared props the hero layout accepts. */
export interface HeroLayoutProps {
    locale: string;
    onStart: () => void;
    /** "overlay" pins the hero behind the app card; "static" flows it as a stacked section. */
    variant?: "overlay" | "static";
}

/** Positioning base: overlay (behind the card) vs static (stacked). */
export function heroRootClass(isOverlay: boolean) {
    return cn("px-6", isOverlay ? "absolute inset-0" : "relative min-h-full w-full py-20");
}

/** Soft brand glow. Position it via className (left/top/size/translate). */
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
export function GiovanniMark({ className }: { className?: string }) {
    return (
        <span className={cn("inline-flex size-14 items-center justify-center rounded-[1.125rem] shadow-skeuo", className)} style={{ background: "#1d1a16" }}>
            <svg aria-label="Giovanni" className="size-9" role="img" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M34 11c-11.05 0-20 8.95-20 20s8.95 20 20 20c4.96 0 9.52-1.81 13.02-4.82V29.5H33v8h5.92v4.08A12.04 12.04 0 0 1 34 42.66c-6.44 0-11.66-5.22-11.66-11.66S27.56 19.34 34 19.34c3.31 0 6.3 1.38 8.42 3.6l5.88-5.88A19.93 19.93 0 0 0 34 11Z"
                    fill="#f7efe2"
                />
            </svg>
        </span>
    );
}

const TOOL_LINKS = [
    { key: "split", to: "/$locale/split" },
    { key: "merge", to: "/$locale/merge" },
    { key: "organize", to: "/$locale/organize" },
    { key: "extractImages", to: "/$locale/extract-images" },
    { key: "pdfToJpg", to: "/$locale/pdf-to-jpg" },
] as const;

/**
 * Tool entrypoints as a row of buttons. Compress is the primary button and scrolls
 * down to dock the live tool in place; the rest link to their own tool routes.
 */
export function HeroToolButtons({ locale, onStart, align = "center", className }: { locale: string; onStart: () => void; align?: "center" | "start"; className?: string }) {
    const { t } = useTranslation();
    return (
        <div className={cn("flex flex-wrap gap-2", align === "center" ? "justify-center" : "justify-start", className)}>
            <button
                className="rounded-[9px] border border-brand-dark/60 bg-brand px-4 py-2 text-[13px] font-semibold text-white shadow-skeuo transition-colors hover:bg-brand-hover active:translate-y-px active:shadow-none"
                onClick={onStart}
                type="button"
            >
                {t("nav.compress")}
            </button>
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
