import { createRouter } from "@tanstack/react-router";
import type { i18n as I18nType } from "i18next";
import { routeTree } from "@/routeTree.gen";
import clientI18n, { createI18nInstance } from "@/lib/i18n";

export interface RouterContext {
    i18n: I18nType;
}

export function getRouter() {
    // On the server getRouter() is called once per request, so each request
    // gets its own isolated i18n instance — no shared mutable state.
    // On the client there is only one call (and one user), so the singleton is fine.
    const i18nInstance: I18nType =
        typeof window === "undefined" ? createI18nInstance() : clientI18n;

    return createRouter({
        routeTree,
        scrollRestoration: true,
        context: { i18n: i18nInstance } satisfies RouterContext,
    });
}

declare module "@tanstack/react-router" {
    interface Register {
        router: ReturnType<typeof getRouter>;
    }
}
