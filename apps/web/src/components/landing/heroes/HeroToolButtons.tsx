import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const TOOL_LINKS = [
    { key: "split", to: "/$locale/split" },
    { key: "merge", to: "/$locale/merge" },
    { key: "organize", to: "/$locale/organize" },
    { key: "extractImages", to: "/$locale/extract-images" },
    { key: "pdfToJpg", to: "/$locale/pdf-to-jpg" },
] as const;

interface HeroToolButtonsProps {
    locale: string;
    onStart: () => void;
    align?: "center" | "start";
    className?: string;
}

/**
 * Tool entrypoints as a row of buttons. Compress is the primary button and scrolls
 * down to dock the live tool in place; the rest link to their own tool routes.
 */
export function HeroToolButtons({ locale, onStart, align = "center", className }: HeroToolButtonsProps) {
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
