import { createFileRoute } from "@tanstack/react-router";
import { PdfToJpgTool } from "@/components/pdf/tools/PdfToJpgTool";

export const Route = createFileRoute("/$locale/pdf-to-jpg")({
    component: PdfToJpgTool,
});
