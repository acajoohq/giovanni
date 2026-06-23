import { useParams } from "@tanstack/react-router";
import { animate, useScroll, useReducedMotion, useTransform } from "motion/react";
import { useCallback, useRef, useSyncExternalStore } from "react";
import { CompressTool } from "@/components/pdf/tools/CompressTool";
import { AppRevealCard } from "@/components/landing/AppRevealCard";
import { HeroButtons } from "@/components/landing/heroes/HeroButtons";

/**
 * Home page: a marketing hero layered behind the live Compress tool. Scrolling
 * lifts the app card up until it docks full-bleed, turning the landing into a
 * usable workspace (YouTube-fullscreen style). Falls back to a plain stacked
 * layout when motion is reduced or on small screens.
 */
export function LandingHome() {
    const { locale = "en" } = useParams({ strict: false });
    const reduceMotion = useReducedMotion();
    const isSmallScreen = useIsSmallScreen();
    const simpleLayout = reduceMotion || isSmallScreen;

    const scrollRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({ container: scrollRef });

    // The hero stays static — the rising card simply covers it. Animating the hero's
    // opacity/transform re-rasterizes the text layer mid-scroll, which reads as a flash.
    const cardY = useTransform(scrollYProgress, [0, 1], ["86%", "0%"]);
    const cardScale = useTransform(scrollYProgress, [0, 1], [0.93, 1]);
    const cardRadius = useTransform(scrollYProgress, [0, 1], [28, 0]);

    const handleStart = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const to = el.scrollHeight - el.clientHeight;
        if (el.scrollTop >= to - 1) return;
        // Drive the scroll ourselves: native `behavior: "smooth"` fights the mandatory
        // scroll-snap and yanks to the snap point instead of animating. Disable snap for
        // the duration of the eased tween, then restore it once docked.
        el.style.scrollSnapType = "none";
        animate(el.scrollTop, to, {
            duration: 0.8,
            ease: [0.4, 0, 0.2, 1],
            onUpdate: (v) => {
                el.scrollTop = v;
            },
            onComplete: () => {
                el.style.scrollSnapType = "";
            },
        });
    }, []);

    if (simpleLayout) {
        return (
            <div className="h-full overflow-y-auto overflow-x-hidden bg-app-bg" ref={scrollRef}>
                <section className="relative flex min-h-full">
                    <HeroButtons locale={locale} onStart={handleStart} variant="static" />
                </section>
                <section className="h-[100dvh] min-h-[32rem] border-t border-app-border">
                    <CompressTool />
                </section>
            </div>
        );
    }

    return (
        <div
            className="relative h-full overflow-y-auto overflow-x-hidden bg-app-bg [scroll-snap-type:y_mandatory]"
            ref={scrollRef}
        >
            <div className="relative h-[200%]">
                {/* snap anchors: hero (top) and docked app (one screen down) */}
                <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px [scroll-snap-align:start]" />
                <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 h-px [scroll-snap-align:start]" />

                {/* pinned stage — one screen tall, holds both layers */}
                <div className="sticky top-0 h-1/2 overflow-hidden">
                    <HeroButtons locale={locale} onStart={handleStart} />
                    <AppRevealCard borderRadius={cardRadius} scale={cardScale} y={cardY} />
                </div>
            </div>
        </div>
    );
}

/** True below the `sm` breakpoint (640px). SSR-safe: renders the motion layout on the server. */
function useIsSmallScreen() {
    const subscribe = useCallback((onChange: () => void) => {
        const mql = window.matchMedia("(max-width: 639px)");
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
    }, []);

    return useSyncExternalStore(
        subscribe,
        () => window.matchMedia("(max-width: 639px)").matches,
        () => false,
    );
}
