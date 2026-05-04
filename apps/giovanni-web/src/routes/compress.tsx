import { createFileRoute } from "@tanstack/react-router";
import { CompressTool } from "@/components/pdfTools/CompressTool";

export const Route = createFileRoute("/compress")({
    component: CompressTool,
});
