import { useSyncExternalStore } from "react";
import { getDesktopInvoke, getIsDesktopClient } from "@/lib/desktop/utils/desktop.util";

export function useDesktopClient() {
    const isDesktop = useSyncExternalStore(
        () => () => {},
        () => getIsDesktopClient(),
        () => false,
    );

    const invoke = useSyncExternalStore(
        () => () => {},
        () => getDesktopInvoke(),
        () => undefined,
    );

    return { invoke, isDesktop };
}
