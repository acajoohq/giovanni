import { useEffect } from "react";
import { isTauri, isTauriMacOs } from "@/utils/tauri.utils";

export function TauriDocumentClass() {
    useEffect(() => {
        if (!isTauri()) {
            return;
        }

        const root = document.documentElement;
        root.classList.add("tauri");

        if (isTauriMacOs()) {
            root.classList.add("tauri-macos");
        }

        return () => {
            root.classList.remove("tauri", "tauri-macos");
        };
    }, []);

    return null;
}
