import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/watermark")({
    beforeLoad: () => {
        throw redirect({ to: "/$locale/watermark", params: { locale: "en" }, replace: true });
    },
});
