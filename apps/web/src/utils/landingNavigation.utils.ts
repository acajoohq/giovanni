import type { RegisteredRouter } from "@tanstack/react-router";
import { LANDING_TOOLS } from "@/components/landing/landingTool.registry";
import type { LandingToolKey } from "@/types/landingTool.types";
import { getLandingTool } from "@/utils/landingTool.utils";
import "@/types/landingNavigation.types";

interface NavigateFromLandingOptions {
    locale: string;
    tool: LandingToolKey;
    replace?: boolean;
}

export function isFromLandingLocation(state: unknown): boolean {
    return typeof state === "object" && state !== null && "fromLanding" in state && state.fromLanding === true;
}

export function getLandingToolKeyFromPathname(
    router: RegisteredRouter,
    pathname: string,
    locale: string,
): LandingToolKey | null {
    for (const tool of LANDING_TOOLS) {
        const toolPath = router.buildLocation({ to: tool.to, params: { locale } }).pathname;

        if (pathname === toolPath) {
            return tool.key;
        }
    }

    return null;
}

export function navigateFromLanding(router: RegisteredRouter, { locale, tool, replace = false }: NavigateFromLandingOptions) {
    void router.navigate({
        to: getLandingTool(tool).to,
        params: { locale },
        replace,
        state: { fromLanding: true },
    });
}
