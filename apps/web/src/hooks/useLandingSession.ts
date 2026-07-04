import { useParams, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { LandingToolKey } from "@/types/landingTool.types";
import { getLandingToolKeyFromPathname, isFromLandingLocation } from "@/utils/landingNavigation.utils";
import { clearLandingSessionPath, readLandingSessionPath, storeLandingSessionPath } from "@/utils/landingSession.utils";

interface UseLandingSessionResult {
    isLandingHomeVisible: boolean;
    isLandingIndex: boolean;
    isLandingSessionActive: boolean;
    landingToolKey: LandingToolKey | null;
    clearLandingSession: () => void;
}

/**
 * Decides when the landing experience owns the main outlet: on the home route,
 * or on a tool route reached from the landing hero (desktop only). The session
 * survives reloads via sessionStorage but never activates before hydration,
 * so server and first client render stay identical.
 */
export function useLandingSession(): UseLandingSessionResult {
    const router = useRouter();
    const { locale = "en" } = useParams({ strict: false });
    const { fromLanding, pathname, isLandingIndex } = useRouterState({
        select: (state) => ({
            fromLanding: isFromLandingLocation(state.location.state),
            pathname: state.location.pathname,
            isLandingIndex: state.matches.some((match) => match.routeId === "/$locale/"),
        }),
    });
    const isMobile = useMediaQuery("(max-width: 639px)");
    const [hasHydrated, setHasHydrated] = useState(false);

    const landingToolKey = getLandingToolKeyFromPathname(router, pathname, locale);
    const isLandingSessionActive =
        hasHydrated && !isMobile && landingToolKey !== null && (fromLanding || readLandingSessionPath() === pathname);

    useEffect(() => {
        setHasHydrated(true);
    }, []);

    useEffect(() => {
        if (!hasHydrated) {
            return;
        }

        if (isLandingIndex || landingToolKey === null || isMobile) {
            clearLandingSessionPath();

            return;
        }

        if (fromLanding) {
            storeLandingSessionPath(pathname);
        }
    }, [fromLanding, hasHydrated, isLandingIndex, isMobile, landingToolKey, pathname]);

    return {
        isLandingHomeVisible: isLandingIndex || isLandingSessionActive,
        isLandingIndex,
        isLandingSessionActive,
        landingToolKey,
        clearLandingSession: clearLandingSessionPath,
    };
}
