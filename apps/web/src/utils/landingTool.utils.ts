import type { LandingToolDefinition, LandingToolKey } from "@/types/landingTool.types";
import { LANDING_TOOLS } from "@/components/landing/landingTool.registry";

const LANDING_TOOL_BY_KEY = Object.fromEntries(LANDING_TOOLS.map((tool) => [tool.key, tool])) as Record<
    LandingToolKey,
    LandingToolDefinition
>;

export function getLandingTool(key: LandingToolKey): LandingToolDefinition {
    return LANDING_TOOL_BY_KEY[key];
}
