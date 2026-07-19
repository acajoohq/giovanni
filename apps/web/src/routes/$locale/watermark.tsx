import { createFileRoute } from "@tanstack/react-router";
import { WatermarkTool } from "@/components/pdf/tools/WatermarkTool";

export const Route = createFileRoute("/$locale/watermark")({
    component: WatermarkTool,
});
