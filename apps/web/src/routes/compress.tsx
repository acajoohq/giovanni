import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/compress")({
    beforeLoad: () => {
        throw redirect({ to: "/$locale/compress", params: { locale: "en" }, replace: true });
    },
});
