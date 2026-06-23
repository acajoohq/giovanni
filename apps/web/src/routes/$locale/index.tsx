import { createFileRoute } from "@tanstack/react-router";
import { LandingHome } from "@/components/landing/LandingHome";

export const Route = createFileRoute("/$locale/")({
    component: LandingHome,
});
