import { createFileRoute } from "@tanstack/react-router";
import { MergeTool } from "@/components/pdf/tools/MergeTool";

export const Route = createFileRoute("/$locale/merge")({
    component: MergeTool,
});
