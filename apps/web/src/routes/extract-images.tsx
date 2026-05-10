import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/extract-images")({
    beforeLoad: () => {
        throw redirect({ to: "/$locale/extract-images", params: { locale: "en" }, replace: true });
    },
});
