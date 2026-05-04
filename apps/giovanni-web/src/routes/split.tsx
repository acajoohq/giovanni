import { createFileRoute } from "@tanstack/react-router";
import { SplitTool } from "@/components/pdfTools/SplitTool";

export const Route = createFileRoute("/split")({
    component: SplitTool,
});
