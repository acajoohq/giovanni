import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/split")({
    beforeLoad: () => {
        throw redirect({ to: "/$locale/split", params: { locale: "en" }, replace: true });
    },
});
