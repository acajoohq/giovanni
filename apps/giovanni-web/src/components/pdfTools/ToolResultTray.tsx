import type { ReactNode } from "react";
import { RiCheckboxCircleLine, RiCloseCircleLine, RiFilePdf2Line, RiInformationLine } from "@remixicon/react";
import { cn } from "@/lib/utils";
import type { ToolStatus } from "@/lib/features/pdfTools/utils/toolStatus";
import { Button } from "@/components/ui/shadcn/Button";

interface ToolResultMetric {
    label: string;
    value: ReactNode;
    tone?: "accent" | "neutral";
}

interface ToolResultAction {
    label: string;
    onClick: () => void;
    disabled?: boolean;
}

interface ToolResultTrayProps {
    fileName?: string;
    fileSize?: string;
    status?: ToolStatus;
    metrics?: ToolResultMetric[];
    primaryAction?: ToolResultAction;
    secondaryActions?: ToolResultAction[];
}

export function ToolResultTray({ fileName, fileSize, metrics = [], primaryAction, secondaryActions = [], status }: ToolResultTrayProps) {
    if (!fileName && !status && metrics.length === 0 && !primaryAction && secondaryActions.length === 0) {
        return null;
    }

    return (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-40 flex justify-center lg:bottom-4">
            <div className="pointer-events-auto flex max-w-[min(920px,calc(100vw-2rem))] flex-col gap-2 rounded-[8px] border border-white/10 bg-app-surface/92 p-2 shadow-result-tray backdrop-blur-xl md:flex-row md:items-center">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    {fileName && (
                        <div className="flex min-w-0 items-center gap-2 rounded-[6px] border border-white/8 bg-white/[0.03] px-2.5 py-1.5">
                            <RiFilePdf2Line className="size-4 shrink-0 text-brand" />
                            <span className="max-w-[180px] truncate text-[11px] font-medium text-neutral-200 lg:max-w-[240px]">{fileName}</span>
                            {fileSize && <span className="shrink-0 text-[10px] text-neutral-500">{fileSize}</span>}
                        </div>
                    )}

                    {status && (
                        <div
                            className={cn(
                                "flex min-w-0 flex-1 items-center gap-1.5 rounded-[6px] border px-2.5 py-1.5 text-[11px]",
                                status.tone === "error" && "border-red-500/25 bg-red-500/10 text-red-200",
                                status.tone === "success" && "border-emerald-500/25 bg-emerald-500/10 text-emerald-200",
                                status.tone === "info" && "border-white/8 bg-white/[0.03] text-neutral-300",
                            )}
                        >
                            {status.tone === "error" ? <RiCloseCircleLine className="size-3.5 shrink-0" /> : null}
                            {status.tone === "success" ? <RiCheckboxCircleLine className="size-3.5 shrink-0" /> : null}
                            {status.tone === "info" ? <RiInformationLine className="size-3.5 shrink-0" /> : null}
                            <span className="truncate">{status.message}</span>
                        </div>
                    )}

                    {metrics.length > 0 && (
                        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                            {metrics.map((metric) => (
                                <div key={metric.label} className="rounded-[6px] border border-white/8 bg-black/30 px-2.5 py-1.5">
                                    <div className="text-[9px] uppercase tracking-wide text-neutral-500">{metric.label}</div>
                                    <div className={cn("mt-0.5 text-[12px] font-semibold", metric.tone === "accent" ? "text-brand" : "text-neutral-100")}>{metric.value}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {(primaryAction || secondaryActions.length > 0) && (
                    <div className="flex shrink-0 items-center justify-end gap-1.5">
                        {secondaryActions.map((action) => (
                            <Button
                                key={action.label}
                                className="h-7 rounded-[5px] border border-white/8 bg-white/[0.04] px-2 text-[11px] text-neutral-300 hover:bg-white/[0.08]"
                                disabled={action.disabled}
                                size="sm"
                                variant="secondary"
                                onClick={action.onClick}
                            >
                                {action.label}
                            </Button>
                        ))}
                        {primaryAction && (
                            <Button
                                className="h-7 rounded-[5px] border border-black/30 bg-brand px-3 text-[11px] font-semibold text-white shadow-sm hover:bg-brand-hover"
                                disabled={primaryAction.disabled}
                                size="sm"
                                onClick={primaryAction.onClick}
                            >
                                {primaryAction.label}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
