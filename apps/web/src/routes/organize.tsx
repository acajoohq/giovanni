import { createFileRoute } from "@tanstack/react-router";
import { OrganizeTool } from "@/components/pdf/tools/OrganizeTool";

export const Route = createFileRoute("/organize")({
    component: OrganizeTool,
});
