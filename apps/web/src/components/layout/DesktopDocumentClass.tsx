import { useEffect } from "react";
import { injectDesktopHTMLClasses, removeDesktopHTMLClasses } from "@/lib/desktop/utils/desktop.util";

/** Syncs desktop detection to `<html>` classes (mirrors Lemni preload `injectHTMLClasses`). */
export function DesktopDocumentClass() {
    useEffect(() => {
        injectDesktopHTMLClasses();

        return () => {
            removeDesktopHTMLClasses();
        };
    }, []);

    return null;
}
