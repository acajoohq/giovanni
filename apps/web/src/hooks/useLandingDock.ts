import { animate } from "motion/react";
import { useCallback, useEffect, useRef, type RefObject } from "react";

const DOCK_DURATION = 0.8;
const DOCK_EASE = [0.4, 0, 0.2, 1] as [number, number, number, number];
const HERO_SCROLL_THRESHOLD = 2;

function getDockScrollTop(container: HTMLElement, section?: HTMLElement | null): number {
    if (section) {
        return section.offsetTop;
    }

    return container.scrollHeight - container.clientHeight;
}

function isContainerDocked(container: HTMLElement, section?: HTMLElement | null): boolean {
    return container.scrollTop >= getDockScrollTop(container, section) - 1;
}

function syncScrollSnap(container: HTMLElement, usesScrollSnap: boolean, scrollTop: number, isAnimating: boolean) {
    if (!usesScrollSnap) {
        return;
    }

    const atHero = scrollTop <= HERO_SCROLL_THRESHOLD;

    // snap only when resting at the hero — free scroll everywhere else
    container.style.scrollSnapType = atHero && !isAnimating ? "" : "none";
}

interface UseLandingDockOptions {
    sectionRef?: RefObject<HTMLElement | null>;
    usesScrollSnap?: boolean;
}

export function useLandingDock(scrollRef: RefObject<HTMLElement | null>, options: UseLandingDockOptions = {}) {
    const { sectionRef, usesScrollSnap = false } = options;
    const isAnimatingRef = useRef(false);
    const cancelScrollRef = useRef<(() => void) | null>(null);

    const getIsDocked = useCallback((): boolean => {
        const container = scrollRef.current;

        if (!container) {
            return false;
        }

        return isContainerDocked(container, sectionRef?.current);
    }, [scrollRef, sectionRef]);

    const syncScroll = useCallback(() => {
        const container = scrollRef.current;

        if (!container) {
            return;
        }

        syncScrollSnap(container, usesScrollSnap, container.scrollTop, isAnimatingRef.current);
    }, [scrollRef, usesScrollSnap]);

    useEffect(() => {
        const container = scrollRef.current;

        if (!container) {
            return;
        }

        syncScroll();
        container.addEventListener("scroll", syncScroll, { passive: true });

        return () => container.removeEventListener("scroll", syncScroll);
    }, [scrollRef, syncScroll]);

    const animateScrollTo = useCallback(
        (container: HTMLElement, targetScrollTop: number, onComplete?: () => void) => {
            cancelScrollRef.current?.();
            isAnimatingRef.current = true;
            syncScrollSnap(container, usesScrollSnap, container.scrollTop, true);

            const controls = animate(container.scrollTop, targetScrollTop, {
                duration: DOCK_DURATION,
                ease: DOCK_EASE,
                onUpdate: (value) => {
                    container.scrollTop = value;
                },
                onComplete: () => {
                    cancelScrollRef.current = null;
                    isAnimatingRef.current = false;
                    syncScrollSnap(container, usesScrollSnap, container.scrollTop, false);
                    onComplete?.();
                },
            });

            cancelScrollRef.current = () => {
                controls.stop();
                isAnimatingRef.current = false;
                cancelScrollRef.current = null;
                syncScroll();
            };
        },
        [syncScroll, usesScrollSnap],
    );

    const scrollToDock = useCallback(
        (onComplete?: () => void) => {
            const container = scrollRef.current;

            if (!container || isContainerDocked(container, sectionRef?.current)) {
                onComplete?.();

                return;
            }

            animateScrollTo(container, getDockScrollTop(container, sectionRef?.current), onComplete);
        },
        [animateScrollTo, scrollRef, sectionRef],
    );

    const scrollToHero = useCallback(() => {
        const container = scrollRef.current;

        if (!container || container.scrollTop === 0) {
            return;
        }

        animateScrollTo(container, 0);
    }, [animateScrollTo, scrollRef]);

    const jumpToDock = useCallback(() => {
        const container = scrollRef.current;

        if (!container) {
            return;
        }

        cancelScrollRef.current?.();
        isAnimatingRef.current = false;
        container.scrollTop = getDockScrollTop(container, sectionRef?.current);
        syncScrollSnap(container, usesScrollSnap, container.scrollTop, false);
    }, [scrollRef, sectionRef, usesScrollSnap]);

    useEffect(() => () => cancelScrollRef.current?.(), []);

    return { getIsDocked, scrollToDock, scrollToHero, jumpToDock };
}
