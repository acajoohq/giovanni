import { createFileRoute } from "@tanstack/react-router";
import { OrganizeTool } from "@/components/pdf/tools/organize/OrganizeTool";

export const Route = createFileRoute("/$locale/organize")({
    component: OrganizeTool,
});
