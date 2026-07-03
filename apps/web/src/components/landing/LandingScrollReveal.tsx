import { useParams, useRouter } from "@tanstack/react-router";
import { AnimatePresence, motion, useMotionValue, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AppRevealCard } from "@/components/landing/AppRevealCard";
import { HeroToolNav } from "@/components/landing/HeroToolNav";
import { LandingHero } from "@/components/landing/LandingHero";
import { LANDING_TOOL_COMPONENTS } from "@/components/landing/landingTool.registry";
import { DEFAULT_LANDING_TOOL } from "@/constants/landingTool.constants";
import { useLandingDock } from "@/hooks/useLandingDock";
import type { LandingToolKey } from "@/types/landingTool.types";
import { navigateFromLanding } from "@/utils/landingNavigation.utils";

const SCROLL_CONTAINER_CLASS = "h-full overflow-x-hidden overflow-y-scroll bg-app-bg [scrollbar-gutter:stable] [overflow-anchor:none]";

interface LandingScrollRevealProps {
    initialTool?: LandingToolKey;
    startDocked: boolean;
    isSimpleLayout: boolean;
}

/**
 * Desktop landing: the live tool rises from behind the hero and docks
 * full-bleed on scroll. Stays mounted across hero → tool navigation — a
 * remount would repaint the card at its undocked position for a frame.
 */
export function LandingScrollReveal({ initialTool, startDocked, isSimpleLayout }: LandingScrollRevealProps) {
    const router = useRouter();
    const { locale = "en" } = useParams({ strict: false });

    const [activeTool, setActiveTool] = useState(initialTool ?? DEFAULT_LANDING_TOOL);
    const scrollRef = useRef<HTMLDivElement>(null);
    const toolSectionRef = useRef<HTMLElement>(null);
    const wasDockedRef = useRef(false);

    const { getIsDocked, scrollToDock, scrollToHero, jumpToDock } = useLandingDock(scrollRef, {
        sectionRef: isSimpleLayout ? toolSectionRef : undefined,
        usesScrollSnap: !isSimpleLayout,
    });

    const { scrollYProgress } = useScroll({ container: scrollRef });

    // seeded from startDocked so a mount on a docked session paints docked on the very first frame
    const revealProgress = useMotionValue(startDocked ? 1 : 0);
    const cardY = useTransform(revealProgress, [0, 1], ["86%", "0%"]);
    const cardScale = useTransform(revealProgress, [0, 1], [0.93, 1]);
    const cardRadius = useTransform(revealProgress, [0, 1], [28, 0]);

    useMotionValueEvent(scrollYProgress, "change", (progress) => revealProgress.set(progress));

    const openTool = (tool: LandingToolKey) => {
        if (tool !== activeTool) {
            setActiveTool(tool);
        }

        const navigate = () => navigateFromLanding(router, { locale, tool, replace: getIsDocked() || startDocked });

        if (getIsDocked()) {
            navigate();

            return;
        }

        scrollToDock(navigate);
    };

    // follow navigation while staying mounted: dock on session restore, return to the hero when leaving it
    useLayoutEffect(() => {
        if (startDocked && !getIsDocked()) {
            jumpToDock();
        }

        if (!startDocked && wasDockedRef.current) {
            scrollToHero();
        }

        wasDockedRef.current = startDocked;
    }, [getIsDocked, jumpToDock, scrollToHero, startDocked]);

    useEffect(() => {
        if (initialTool) {
            setActiveTool(initialTool);
        }
    }, [initialTool]);

    const ActiveToolComponent = LANDING_TOOL_COMPONENTS[activeTool];

    const toolWorkspace = (
        <div className="landing-tool-view h-full w-full">
            <AnimatePresence initial={false} mode="popLayout">
                <motion.div
                    animate={{ opacity: 1 }}
                    className="h-full w-full"
                    exit={{ opacity: 0 }}
                    initial={{ opacity: 0 }}
                    key={activeTool}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                >
                    <ActiveToolComponent />
                </motion.div>
            </AnimatePresence>
        </div>
    );

    if (isSimpleLayout) {
        return (
            <div className={SCROLL_CONTAINER_CLASS} ref={scrollRef}>
                <section className="relative flex min-h-full">
                    <LandingHero variant="static">
                        <HeroToolNav activeTool={activeTool} className="mt-9" onSelectTool={openTool} />
                    </LandingHero>
                </section>
                <section className="h-[100dvh] min-h-[32rem] border-t border-app-border" ref={toolSectionRef}>
                    {toolWorkspace}
                </section>
            </div>
        );
    }

    return (
        <div className={`relative [scroll-snap-type:y_mandatory] ${SCROLL_CONTAINER_CLASS}`} ref={scrollRef}>
            <div className="relative h-[200%]">
                <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px [scroll-snap-align:start]" />
                <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 h-px [scroll-snap-align:start]" />

                <div className="sticky top-0 h-1/2 overflow-hidden">
                    <LandingHero>
                        <HeroToolNav activeTool={activeTool} className="mt-9" onSelectTool={openTool} />
                    </LandingHero>
                    <AppRevealCard borderRadius={cardRadius} scale={cardScale} y={cardY}>
                        {toolWorkspace}
                    </AppRevealCard>
                </div>
            </div>
        </div>
    );
}
