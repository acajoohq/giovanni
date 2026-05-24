import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { usePendingFile } from "@/providers/PendingFileProvider";
import { ACTION_TO_ROUTE } from "@/constants/toolRoute.constants";
import type { ToolAction, ToolRoute } from "@/types/toolRoute.types";

interface PendingOpenResult {
    action: string;
    file_path: string;
    file_bytes: number[];
}

function isToolAction(action: string): action is ToolAction {
    return ACTION_TO_ROUTE.hasOwnProperty(action);
}

/**
 * Returns the Tauri `invoke` function when running inside the desktop app,
 * or `null` when running in a regular browser.
 *
 * Tauri v2 injects `window.__TAURI_INTERNALS__` into the webview so we can
 * call commands without bundling `@tauri-apps/api` into the web build.
 */
function getTauriInvoke(): ((cmd: string, args?: Record<string, unknown>) => Promise<unknown>) | null {
    if (typeof window === "undefined") return null;
    const internals = (window as unknown as Record<string, unknown>)["__TAURI_INTERNALS__"] as
        | { invoke?: (cmd: string, args?: Record<string, unknown>) => Promise<unknown> }
        | undefined;
    return internals?.invoke ?? null;
}

/**
 * On mount, checks whether the app was launched from the OS context menu
 * (i.e. with `--action <tool> --file <path>` arguments).
 *
 * If so, reads the file bytes via a Tauri command, creates a `File` object,
 * stores it in `PendingFileProvider`, and navigates to the matching tool route
 * so the tool picks it up automatically.
 */
export function useTauriStartup(): void {
    const navigate = useNavigate();
    const { locale = "en" } = useParams({ strict: false });
    const { setPendingFile } = usePendingFile();
    // Guard against StrictMode double-invocation
    const handled = useRef(false);

    useEffect(() => {
        if (handled.current) return;
        const invoke = getTauriInvoke();
        if (!invoke) return;

        handled.current = true;

        async function handlePendingAction(invoke: NonNullable<ReturnType<typeof getTauriInvoke>>) {
            try {
                const pending = (await invoke("get_pending_action")) as PendingOpenResult | null;
                if (!pending) return;

                if (!isToolAction(pending.action)) {
                    console.warn(`[Tauri] Unknown action: ${pending.action}`);
                    return;
                }

                const uint8Array = new Uint8Array(pending.file_bytes);
                const fileName = pending.file_path.replace(/\\/g, "/").split("/").pop() ?? "file.pdf";
                const file = new File([uint8Array], fileName, { type: "application/pdf" });

                // Stage the file so the target tool loads it on mount
                setPendingFile(file);

                const route: ToolRoute = ACTION_TO_ROUTE[pending.action];
                void navigate({ to: route, params: { locale } });
            } catch (err) {
                console.error("[Tauri] Failed to handle OS context menu action:", err);
            }
        }

        void handlePendingAction(invoke);
    }, [locale, navigate, setPendingFile]);
}
