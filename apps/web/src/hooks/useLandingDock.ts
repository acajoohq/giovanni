import { animate } from "motion/react";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

const DOCK_DURATION = 0.8;
const DOCK_EASE = [0.4, 0, 0.2, 1] as [number, number, number, number];

function getDockScrollTop(container: HTMLElement, section?: HTMLElement | null): number {
    if (section) {
        return section.offsetTop;
    }

    return container.scrollHeight - container.clientHeight;
}

function isContainerDocked(container: HTMLElement, section?: HTMLElement | null): boolean {
    return container.scrollTop >= getDockScrollTop(container, section) - 1;
}

function syncScrollSnap(container: HTMLElement, usesScrollSnap: boolean, docked: boolean) {
    if (!usesScrollSnap) {
        return;
    }

    container.style.scrollSnapType = docked ? "none" : "";
}

interface UseLandingDockOptions {
    sectionRef?: RefObject<HTMLElement | null>;
    usesScrollSnap?: boolean;
}

export function useLandingDock(scrollRef: RefObject<HTMLElement | null>, options: UseLandingDockOptions = {}) {
    const { sectionRef, usesScrollSnap = false } = options;
    const [isDocked, setIsDocked] = useState(false);
    const isAnimatingRef = useRef(false);
    const cancelScrollRef = useRef<(() => void) | null>(null);

    const syncDocked = useCallback(() => {
        const container = scrollRef.current;

        if (!container) {
            return;
        }

        const docked = isContainerDocked(container, sectionRef?.current);

        syncScrollSnap(container, usesScrollSnap, docked || isAnimatingRef.current);
        setIsDocked(docked);
    }, [scrollRef, sectionRef, usesScrollSnap]);

    useEffect(() => {
        const container = scrollRef.current;

        if (!container) {
            return;
        }

        syncDocked();
        container.addEventListener("scroll", syncDocked, { passive: true });

        return () => container.removeEventListener("scroll", syncDocked);
    }, [scrollRef, syncDocked]);

    const scrollToDock = useCallback(
        (onComplete?: () => void) => {
            const container = scrollRef.current;

            if (!container) {
                onComplete?.();

                return;
            }

            const targetScrollTop = getDockScrollTop(container, sectionRef?.current);

            if (isContainerDocked(container, sectionRef?.current)) {
                onComplete?.();

                return;
            }

            cancelScrollRef.current?.();
            isAnimatingRef.current = true;
            syncScrollSnap(container, usesScrollSnap, true);

            const controls = animate(container.scrollTop, targetScrollTop, {
                duration: DOCK_DURATION,
                ease: DOCK_EASE,
                onUpdate: (value) => {
                    container.scrollTop = value;
                },
                onComplete: () => {
                    cancelScrollRef.current = null;
                    isAnimatingRef.current = false;
                    syncDocked();
                    onComplete?.();
                },
            });

            cancelScrollRef.current = () => {
                controls.stop();
                isAnimatingRef.current = false;
                cancelScrollRef.current = null;
                syncDocked();
            };
        },
        [scrollRef, sectionRef, syncDocked, usesScrollSnap],
    );

    const jumpToDock = useCallback(() => {
        const container = scrollRef.current;

        if (!container) {
            return;
        }

        cancelScrollRef.current?.();
        isAnimatingRef.current = false;
        container.scrollTop = getDockScrollTop(container, sectionRef?.current);
        syncScrollSnap(container, usesScrollSnap, true);
        setIsDocked(true);
    }, [scrollRef, sectionRef, usesScrollSnap]);

    useEffect(() => () => cancelScrollRef.current?.(), []);

    return { isDocked, scrollToDock, jumpToDock };
}
