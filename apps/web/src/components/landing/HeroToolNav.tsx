import { Link, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LANDING_TOOL_KEYS } from "@/constants/landingTool.constants";
import type { LandingToolKey } from "@/types/landingTool.types";
import { cn } from "@/lib/utils";
import { getLandingToolRoute } from "@/utils/landingNavigation.utils";

interface HeroToolNavProps {
    activeTool?: LandingToolKey;
    onSelectTool?: (tool: LandingToolKey) => void;
    className?: string;
}

function heroToolClass(isActive: boolean) {
    return cn(
        "rounded-[9px] px-4 py-2 text-[13px] font-medium shadow-skeuo-sm transition-colors active:translate-y-px max-sm:px-5 max-sm:py-2.5",
        isActive
            ? "border border-brand-dark/60 bg-brand font-semibold text-white shadow-skeuo hover:bg-brand-hover active:shadow-none"
            : "border border-app-border bg-app-surface text-app-text-muted hover:bg-app-control-hover hover:text-app-text",
    );
}

/**
 * Tool entries under the hero copy. With `onSelectTool` it acts as a tablist
 * that swaps the docked tool in place; without it, it renders plain links so
 * navigation works even before hydration (mobile).
 */
export function HeroToolNav({ activeTool, onSelectTool, className }: HeroToolNavProps) {
    const { t } = useTranslation();
    const { locale = "en" } = useParams({ strict: false });

    if (onSelectTool) {
        return (
            <div className={cn("flex flex-wrap justify-center gap-2", className)} role="tablist">
                {LANDING_TOOL_KEYS.map((tool) => (
                    <button
                        aria-selected={activeTool === tool}
                        className={heroToolClass(activeTool === tool)}
                        key={tool}
                        onClick={() => onSelectTool(tool)}
                        role="tab"
                        type="button"
                    >
                        {t(`nav.${tool}` as const)}
                    </button>
                ))}
            </div>
        );
    }

    return (
        <nav className={cn("flex flex-wrap justify-center gap-2", className)}>
            {LANDING_TOOL_KEYS.map((tool) => (
                <Link className={heroToolClass(false)} key={tool} params={{ locale }} to={getLandingToolRoute(tool)}>
                    {t(`nav.${tool}` as const)}
                </Link>
            ))}
        </nav>
    );
}
