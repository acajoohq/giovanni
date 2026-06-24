import { useParams, useRouter } from "@tanstack/react-router";
import { AnimatePresence, motion, useScroll, useReducedMotion, useTransform } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AppRevealCard } from "@/components/landing/AppRevealCard";
import { HeroButtons } from "@/components/landing/heroes/HeroButtons";
import { DEFAULT_LANDING_TOOL } from "@/constants/landingTool.constants";
import { useLandingDock } from "@/hooks/useLandingDock";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { LandingToolKey } from "@/types/landingTool.types";
import { navigateFromLanding } from "@/utils/landingNavigation.utils";
import { getLandingTool } from "@/utils/landingTool.utils";

const LANDING_SCROLL_CLASS = "h-full overflow-x-hidden overflow-y-scroll bg-app-bg [scrollbar-gutter:stable] [overflow-anchor:none]";

interface LandingHomeProps {
    initialTool?: LandingToolKey;
    startDocked?: boolean;
}

export function LandingHome({ initialTool, startDocked = false }: LandingHomeProps) {
    const router = useRouter();
    const { locale = "en" } = useParams({ strict: false });
    const reduceMotion = useReducedMotion();
    const isMobile = useMediaQuery("(max-width: 639px)");
    const simpleLayout = Boolean(reduceMotion) && !isMobile;

    if (isMobile) {
        const openTool = (tool: LandingToolKey) => {
            void router.navigate({
                to: getLandingTool(tool).to,
                params: { locale },
            });
        };

        return (
            <div className="h-full bg-app-bg">
                <HeroButtons onSelectTool={openTool} variant="static" />
            </div>
        );
    }

    return (
        <DesktopLandingHome initialTool={initialTool} simpleLayout={simpleLayout} startDocked={startDocked} locale={locale} router={router} />
    );
}

interface DesktopLandingHomeProps {
    initialTool?: LandingToolKey;
    startDocked: boolean;
    simpleLayout: boolean;
    locale: string;
    router: ReturnType<typeof useRouter>;
}

function DesktopLandingHome({ initialTool, startDocked, simpleLayout, locale, router }: DesktopLandingHomeProps) {
    const [activeTool, setActiveTool] = useState(initialTool ?? DEFAULT_LANDING_TOOL);
    const scrollRef = useRef<HTMLDivElement>(null);
    const toolSectionRef = useRef<HTMLElement>(null);

    const { getIsDocked, scrollToDock, jumpToDock } = useLandingDock(scrollRef, {
        sectionRef: simpleLayout ? toolSectionRef : undefined,
        usesScrollSnap: !simpleLayout,
    });

    useLayoutEffect(() => {
        if (startDocked && !getIsDocked()) {
            jumpToDock();
        }
    }, [getIsDocked, jumpToDock, startDocked]);

    useEffect(() => {
        if (initialTool) {
            setActiveTool(initialTool);
        }
    }, [initialTool]);

    const { scrollYProgress } = useScroll({ container: scrollRef });

    // animating the hero mid-scroll re-rasterizes text and reads as a flash
    const cardY = useTransform(scrollYProgress, [0, 1], ["86%", "0%"]);
    const cardScale = useTransform(scrollYProgress, [0, 1], [0.93, 1]);
    const cardRadius = useTransform(scrollYProgress, [0, 1], [28, 0]);

    const ActiveToolComponent = getLandingTool(activeTool).Component;

    const openTool = useCallback(
        (tool: LandingToolKey) => {
            if (tool !== activeTool) {
                setActiveTool(tool);
            }

            const navigate = () => navigateFromLanding(router, { locale, tool, replace: getIsDocked() || startDocked });

            if (getIsDocked()) {
                navigate();

                return;
            }

            scrollToDock(navigate);
        },
        [activeTool, getIsDocked, locale, router, scrollToDock, startDocked],
    );

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

    if (simpleLayout) {
        return (
            <div className={LANDING_SCROLL_CLASS} ref={scrollRef}>
                <section className="relative flex min-h-full">
                    <HeroButtons activeTool={activeTool} onSelectTool={openTool} variant="static" />
                </section>
                <section className="h-[100dvh] min-h-[32rem] border-t border-app-border" ref={toolSectionRef}>
                    {toolWorkspace}
                </section>
            </div>
        );
    }

    return (
        <div className={`relative [scroll-snap-type:y_mandatory] ${LANDING_SCROLL_CLASS}`} ref={scrollRef}>
            <div className="relative h-[200%]">
                <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px [scroll-snap-align:start]" />
                <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 h-px [scroll-snap-align:start]" />

                <div className="sticky top-0 h-1/2 overflow-hidden">
                    <HeroButtons activeTool={activeTool} onSelectTool={openTool} />
                    <AppRevealCard borderRadius={cardRadius} scale={cardScale} y={cardY}>
                        {toolWorkspace}
                    </AppRevealCard>
                </div>
            </div>
        </div>
    );
}
