import { useTranslation } from "react-i18next";
import { LANDING_TOOLS } from "@/components/landing/landingTool.registry";
import type { LandingToolKey } from "@/types/landingTool.types";
import { cn } from "@/lib/utils";

interface HeroToolButtonsProps {
    activeTool?: LandingToolKey;
    onSelectTool: (tool: LandingToolKey) => void;
    className?: string;
}

function heroTabClass(isActive: boolean) {
    return cn(
        "rounded-[9px] px-4 py-2 text-[13px] font-medium shadow-skeuo-sm transition-colors active:translate-y-px",
        isActive
            ? "border border-brand-dark/60 bg-brand font-semibold text-white shadow-skeuo hover:bg-brand-hover active:shadow-none"
            : "border border-app-border bg-app-surface text-app-text-muted hover:bg-app-control-hover hover:text-app-text",
    );
}

export function HeroToolButtons({ activeTool, onSelectTool, className }: HeroToolButtonsProps) {
    const { t } = useTranslation();

    return (
        <div className={cn("flex flex-wrap justify-center gap-2", className)} role="tablist">
            {LANDING_TOOLS.map((tool) => (
                <button
                    aria-selected={activeTool === tool.key}
                    className={heroTabClass(activeTool !== undefined && activeTool === tool.key)}
                    key={tool.key}
                    onClick={() => onSelectTool(tool.key)}
                    role="tab"
                    type="button"
                >
                    {t(`nav.${tool.key}` as const)}
                </button>
            ))}
        </div>
    );
}
