import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/")({
    // LandingHome is rendered by AppShell so the instance survives hero → tool navigation.
    component: () => null,
});
