import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/merge")({
    beforeLoad: () => {
        throw redirect({ to: "/$locale/merge", params: { locale: "en" }, replace: true });
    },
});
