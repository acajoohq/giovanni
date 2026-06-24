import { useTranslation } from "react-i18next";
import type { LandingToolKey } from "@/types/landingTool.types";
import { cn } from "@/lib/utils";
import { GiovanniMark } from "./GiovanniMark";
import { HeroGlow } from "./HeroGlow";
import { HeroToolButtons } from "./HeroToolButtons";

interface HeroButtonsProps {
    activeTool?: LandingToolKey;
    onSelectTool?: (tool: LandingToolKey) => void;
    showToolButtons?: boolean;
    variant?: "overlay" | "static";
}

export function HeroButtons({ activeTool, onSelectTool, showToolButtons = true, variant = "overlay" }: HeroButtonsProps) {
    const { t } = useTranslation();
    const isOverlay = variant === "overlay";

    return (
        <div className={cn("flex flex-col items-center justify-center px-6 text-center", isOverlay ? "absolute inset-0" : "relative min-h-full w-full py-20")}>
            <HeroGlow className="left-1/2 top-[40%] size-[36rem] -translate-x-1/2 -translate-y-1/2" />

            <div className="relative flex w-full max-w-xl flex-col items-center">
                <GiovanniMark />

                <h1 className="mt-8 max-w-[15ch] text-balance font-heading text-[clamp(2.1rem,5.4vw,3.5rem)] font-semibold leading-[1.04] tracking-[-0.025em] text-app-text">
                    {t("home.headline")}
                </h1>

                <p className="mt-5 max-w-[42ch] text-pretty text-[15px] leading-relaxed text-app-text-subtle">{t("home.subhead")}</p>

                {showToolButtons && onSelectTool !== undefined ? (
                    <HeroToolButtons activeTool={activeTool} className="mt-9" onSelectTool={onSelectTool} />
                ) : null}
            </div>
        </div>
    );
}
