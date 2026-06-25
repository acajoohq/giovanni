import type { ComponentType } from "react";
import { CompressTool } from "@/components/pdf/tools/CompressTool";
import { ExtractImagesTool } from "@/components/pdf/tools/ExtractImagesTool";
import { MergeTool } from "@/components/pdf/tools/MergeTool";
import { OrganizeTool } from "@/components/pdf/tools/organize/OrganizeTool";
import { PdfToJpgTool } from "@/components/pdf/tools/PdfToJpgTool";
import { SplitTool } from "@/components/pdf/tools/SplitTool";
import { ACTION_TO_ROUTE } from "@/constants/toolRoute.constants";
import { LANDING_TOOL_ACTION, LANDING_TOOL_KEYS } from "@/constants/landingTool.constants";
import type { LandingToolDefinition, LandingToolKey } from "@/types/landingTool.types";

const LANDING_TOOL_COMPONENTS = {
    compress: CompressTool,
    split: SplitTool,
    merge: MergeTool,
    organize: OrganizeTool,
    extractImages: ExtractImagesTool,
    pdfToJpg: PdfToJpgTool,
} satisfies Record<LandingToolKey, ComponentType>;

export const LANDING_TOOLS: LandingToolDefinition[] = LANDING_TOOL_KEYS.map((key) => ({
    key,
    to: ACTION_TO_ROUTE[LANDING_TOOL_ACTION[key]],
    Component: LANDING_TOOL_COMPONENTS[key],
}));
