import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/pdf-to-jpg")({
    beforeLoad: () => {
        throw redirect({ to: "/$locale/pdf-to-jpg", params: { locale: "en" }, replace: true });
    },
});
