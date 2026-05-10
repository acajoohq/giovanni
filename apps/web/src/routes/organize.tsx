import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/organize")({
    beforeLoad: () => {
        throw redirect({ to: "/$locale/organize", params: { locale: "en" }, replace: true });
    },
});
