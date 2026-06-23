import type { LandingToolKey } from "@/types/landingTool.types";

export interface HeroLayoutProps {
    activeTool: LandingToolKey;
    onSelectTool: (tool: LandingToolKey) => void;
    variant?: "overlay" | "static";
}
