import { createFileRoute } from "@tanstack/react-router";
import { ExtractImagesTool } from "@/components/pdf/tools/ExtractImagesTool";

export const Route = createFileRoute("/$locale/extract-images")({
    component: ExtractImagesTool,
});
