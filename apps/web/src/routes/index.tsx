import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
    beforeLoad: () => {
        const locale = typeof navigator !== "undefined" ? (navigator.language ?? "en").slice(0, 2) : "en";
        const supported = ["en", "fr"];
        const lang = supported.includes(locale) ? locale : "en";
        throw redirect({ to: "/$locale", params: { locale: lang }, replace: true });
    },
});
