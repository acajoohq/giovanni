import { useSyncExternalStore } from "react";
import { getIsDesktopMacOS } from "@/lib/desktop/utils/desktop.util";

export function useIsDesktopMacOS(): boolean {
    return useSyncExternalStore(
        () => () => {},
        () => getIsDesktopMacOS(),
        () => false,
    );
}
