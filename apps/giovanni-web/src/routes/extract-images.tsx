import { createFileRoute } from "@tanstack/react-router";
import { ExtractImagesTool } from "@/components/pdfTools/ExtractImagesTool";

export const Route = createFileRoute("/extract-images")({
    component: ExtractImagesTool,
});
