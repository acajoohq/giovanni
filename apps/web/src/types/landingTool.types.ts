import type { ComponentType } from "react";
import { LANDING_TOOL_ACTION } from "@/constants/landingTool.constants";
import type { ToolRoute } from "@/types/toolRoute.types";

export type LandingToolKey = keyof typeof LANDING_TOOL_ACTION;

export interface LandingToolDefinition {
    key: LandingToolKey;
    to: ToolRoute;
    Component: ComponentType;
}
