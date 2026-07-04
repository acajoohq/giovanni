import type { RegisteredRouter } from "@tanstack/react-router";
import { ACTION_TO_ROUTE } from "@/constants/toolRoute.constants";
import { LANDING_TOOL_ACTION, LANDING_TOOL_KEYS } from "@/constants/landingTool.constants";
import type { LandingToolKey } from "@/types/landingTool.types";
import type { ToolRoute } from "@/types/toolRoute.types";
import { storeLandingSessionPath } from "@/utils/landingSession.utils";
import "@/types/landingNavigation.types";

interface NavigateFromLandingOptions {
    locale: string;
    tool: LandingToolKey;
    replace?: boolean;
}

export function getLandingToolRoute(tool: LandingToolKey): ToolRoute {
    return ACTION_TO_ROUTE[LANDING_TOOL_ACTION[tool]];
}

export function isFromLandingLocation(state: unknown): boolean {
    return typeof state === "object" && state !== null && "fromLanding" in state && state.fromLanding === true;
}

export function getLandingToolKeyFromPathname(router: RegisteredRouter, pathname: string, locale: string): LandingToolKey | null {
    for (const tool of LANDING_TOOL_KEYS) {
        const toolPath = router.buildLocation({ to: getLandingToolRoute(tool), params: { locale } }).pathname;

        if (pathname === toolPath) {
            return tool;
        }
    }

    return null;
}

export function navigateFromLanding(router: RegisteredRouter, { locale, tool, replace = false }: NavigateFromLandingOptions) {
    const toolRoute = getLandingToolRoute(tool);
    const destination = router.buildLocation({ to: toolRoute, params: { locale } });

    storeLandingSessionPath(destination.pathname);

    void router.navigate({
        to: toolRoute,
        params: { locale },
        replace,
        state: { fromLanding: true },
    });
}
