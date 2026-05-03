import { createFileRoute } from "@tanstack/react-router";
import { SplitTool } from "../components/pdf-tools/SplitTool";

export const Route = createFileRoute("/split")({
    component: SplitTool,
});
