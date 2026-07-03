import type { ComponentType } from "react";
import { CompressTool } from "@/components/pdf/tools/CompressTool";
import { ExtractImagesTool } from "@/components/pdf/tools/ExtractImagesTool";
import { MergeTool } from "@/components/pdf/tools/MergeTool";
import { OrganizeTool } from "@/components/pdf/tools/organize/OrganizeTool";
import { PdfToJpgTool } from "@/components/pdf/tools/PdfToJpgTool";
import { SplitTool } from "@/components/pdf/tools/SplitTool";
import type { LandingToolKey } from "@/types/landingTool.types";

export const LANDING_TOOL_COMPONENTS = {
    compress: CompressTool,
    split: SplitTool,
    merge: MergeTool,
    organize: OrganizeTool,
    extractImages: ExtractImagesTool,
    pdfToJpg: PdfToJpgTool,
} satisfies Record<LandingToolKey, ComponentType>;
