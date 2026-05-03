import * as React from "react";
import { cn } from "../../lib/utils";

export type ToolStatus = {
    tone: "info" | "success" | "error";
    message: string;
} | null;

export function ToolStatusLine({ status }: { status: ToolStatus }) {
    if (!status) return null;

    return (
        <div
            className={cn(
                "rounded-[6px] border px-3 py-2 text-[12px]",
                status.tone === "error" && "border-red-500/30 bg-red-500/10 text-red-200",
                status.tone === "success" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
                status.tone === "info" && "border-[#333] bg-[#161616] text-neutral-300",
            )}
        >
            {status.message}
        </div>
    );
}
