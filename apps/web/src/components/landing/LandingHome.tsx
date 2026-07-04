import { useReducedMotion } from "motion/react";
import { HeroToolNav } from "@/components/landing/HeroToolNav";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingScrollReveal } from "@/components/landing/LandingScrollReveal";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { LandingToolKey } from "@/types/landingTool.types";

interface LandingHomeProps {
    initialTool?: LandingToolKey;
    startDocked?: boolean;
}

/**
 * Home experience. Mobile gets a static hero with plain tool links; larger
 * screens get the scroll-reveal (or a stacked layout under reduced motion).
 * Both trees are server-rendered and toggled via CSS so hydration stays
 * stable; the desktop tree unmounts on phones so tools don't load hidden.
 */
export function LandingHome({ initialTool, startDocked = false }: LandingHomeProps) {
    const isMobile = useMediaQuery("(max-width: 639px)");
    const isMotionReduced = useReducedMotion();

    return (
        <>
            <div className="h-full min-h-0 overflow-y-auto bg-app-bg sm:hidden">
                <LandingHero variant="static">
                    <HeroToolNav className="mt-9" />
                </LandingHero>
            </div>

            {!isMobile && (
                <div className="hidden h-full min-h-0 sm:block">
                    <LandingScrollReveal initialTool={initialTool} isSimpleLayout={Boolean(isMotionReduced)} startDocked={startDocked} />
                </div>
            )}
        </>
    );
}
