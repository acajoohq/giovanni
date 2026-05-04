import { createFileRoute } from "@tanstack/react-router";
import { MergeTool } from "@/components/pdfTools/MergeTool";

export const Route = createFileRoute("/merge")({
    component: MergeTool,
});
