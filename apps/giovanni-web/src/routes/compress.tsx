import { createFileRoute } from "@tanstack/react-router";
import { CompressTool } from "../components/pdf-tools/CompressTool";

export const Route = createFileRoute("/compress")({
    component: CompressTool,
});
