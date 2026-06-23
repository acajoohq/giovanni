import { useCallback, useSyncExternalStore } from "react";

/** SSR-safe media query subscription. Returns false on the server. */
export function useMediaQuery(query: string): boolean {
    const subscribe = useCallback(
        (onStoreChange: () => void) => {
            const mediaQueryList = window.matchMedia(query);
            mediaQueryList.addEventListener("change", onStoreChange);

            return () => mediaQueryList.removeEventListener("change", onStoreChange);
        },
        [query],
    );

    const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

    return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
