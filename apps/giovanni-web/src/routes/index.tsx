import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "../components/home/HomePage";
import { createSeoMeta } from "../lib/seo";

export const Route = createFileRoute("/")({
    head: () => ({
        meta: createSeoMeta({
            title: "Giovanni | Frugal PDF Tools",
            description: "A pastel, local-first PDF workspace for compressing, splitting, merging, and extracting images.",
        }),
    }),
    component: HomePage,
});
