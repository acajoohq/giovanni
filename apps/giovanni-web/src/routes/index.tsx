import { createFileRoute } from "@tanstack/react-router";
import { createSeoMeta } from "../lib/seo";

export const Route = createFileRoute("/")({
    head: () => ({
        meta: createSeoMeta({
            title: "Giovanni",
            description: "PDF tools in your browser.",
        }),
    }),
    component: HomeRoute,
});

function HomeRoute() {
    return <main className="min-h-screen bg-white" id="main-content" />;
}
