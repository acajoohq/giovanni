import type { ExtractedImage } from "@pdfly/wasm";
import { formatBytes } from "@pdfly/wasm";
import * as React from "react";
import { RiArrowDownSLine, RiArrowUpSLine, RiCloseLine, RiFilePdf2Line, RiImageLine } from "@remixicon/react";
import { Button } from "../shadcn-ui/Button";
import { cn } from "../../lib/utils";

export type ToolStatus = {
    tone: "info" | "success" | "error";
    message: string;
} | null;

export function ToolStatusLine({ status }: { status: ToolStatus }) {
    if (!status) {
        return null;
    }

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

export function ToolWorkspace({
    title,
    description,
    actions,
    children,
}: {
    title: React.ReactNode;
    description?: React.ReactNode;
    actions?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="w-full max-w-4xl rounded-[8px] border border-[#2a2a2a] bg-[#141414]/95 shadow-[0_18px_60px_rgba(0,0,0,0.38)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#262626] px-5 py-4">
                <div>
                    <h2 className="text-[14px] font-semibold text-white">{title}</h2>
                    {description && <p className="mt-1 text-[12px] text-neutral-500">{description}</p>}
                </div>
                {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
            </div>
            <div className="space-y-4 p-5">{children}</div>
        </div>
    );
}

export function FileSummary({ file }: { file: File }) {
    return (
        <div className="flex min-w-0 items-center gap-3 rounded-[6px] border border-[#2a2a2a] bg-[#101010] px-3 py-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-[5px] border border-[#393939] bg-[#1c1c1c] text-[#eb5a3f]">
                <RiFilePdf2Line className="size-4" />
            </div>
            <div className="min-w-0">
                <div className="truncate text-[12px] font-medium text-neutral-100">{file.name}</div>
                <div className="text-[11px] text-neutral-500">{formatBytes(file.size)}</div>
            </div>
        </div>
    );
}

export function FilesList({ files, onRemove, onMove }: { files: File[]; onRemove?: (index: number) => void; onMove?: (index: number, direction: -1 | 1) => void }) {
    return (
        <div className="space-y-2">
            {files.map((file, index) => (
                <div key={`${file.name}-${file.size}-${index}`} className="flex items-center gap-2 rounded-[6px] border border-[#2a2a2a] bg-[#101010] px-3 py-2">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-[5px] border border-[#393939] bg-[#1c1c1c] text-[#eb5a3f]">
                        <RiFilePdf2Line className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] font-medium text-neutral-100">{file.name}</div>
                        <div className="text-[11px] text-neutral-500">{formatBytes(file.size)}</div>
                    </div>
                    {onMove && (
                        <div className="flex items-center gap-1">
                            <Button aria-label="Move PDF up" disabled={index === 0} size="icon-xs" variant="secondary" onClick={() => onMove(index, -1)}>
                                <RiArrowUpSLine className="size-4" />
                            </Button>
                            <Button aria-label="Move PDF down" disabled={index === files.length - 1} size="icon-xs" variant="secondary" onClick={() => onMove(index, 1)}>
                                <RiArrowDownSLine className="size-4" />
                            </Button>
                        </div>
                    )}
                    {onRemove && (
                        <Button aria-label="Remove PDF" size="icon-xs" variant="secondary" onClick={() => onRemove(index)}>
                            <RiCloseLine className="size-4" />
                        </Button>
                    )}
                </div>
            ))}
        </div>
    );
}

export function MetricGrid({ metrics }: { metrics: Array<{ label: string; value: React.ReactNode; tone?: "accent" | "neutral" }> }) {
    return (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {metrics.map((metric) => (
                <div key={metric.label} className="rounded-[6px] border border-[#2a2a2a] bg-[#101010] px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wide text-neutral-500">{metric.label}</div>
                    <div className={cn("mt-1 text-[13px] font-medium", metric.tone === "accent" ? "text-[#eb5a3f]" : "text-neutral-100")}>{metric.value}</div>
                </div>
            ))}
        </div>
    );
}

export function ImageThumb({ image, url, index }: { image: ExtractedImage; url: string | null; index: number }) {
    let thumbnailContent = (
        <div className="px-3 text-center text-[11px] text-neutral-500">
            <RiImageLine className="mx-auto mb-2 size-5 text-neutral-600" />
            {image.unsupportedReason ?? "Raw bytes only"}
        </div>
    );

    if (url) {
        thumbnailContent = <img alt={`Extracted image ${index + 1}`} className="h-full w-full object-contain" src={url} />;
    }

    return (
        <div className="overflow-hidden rounded-[6px] border border-[#2a2a2a] bg-[#101010]">
            <div className="flex aspect-4/3 items-center justify-center border-b border-[#262626] bg-[#0c0c0c]">{thumbnailContent}</div>
            <div className="space-y-1 p-3">
                <div className="text-[12px] font-medium text-neutral-100">
                    {image.width}x{image.height}
                </div>
                <div className="text-[11px] text-neutral-500">
                    {image.filter} · page {image.pageIndex + 1} · {formatBytes(image.bytes.byteLength)}
                </div>
            </div>
        </div>
    );
}
