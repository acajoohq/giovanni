import { RiArrowDownLine, RiArrowUpLine, RiDragMove2Line } from "@remixicon/react";
import { type DragEvent } from "react";
import { PdfPageThumbnail } from "@/components/pdf/PdfPageThumbnail";
import { cn } from "@/lib/utils";

interface OrganizePageCardProps {
    originalIndex: number;
    currentIndex: number;
    pageCount: number;
    pageData: Uint8Array;
    isDragSource: boolean;
    onDragStart: () => void;
    onDragOver: (e: DragEvent<HTMLDivElement>) => void;
    onDrop: () => void;
    onDragEnd: () => void;
    onMove: (direction: -1 | 1) => void;
}

export function OrganizePageCard({ originalIndex, currentIndex, pageCount, pageData, isDragSource, onDragStart, onDragOver, onDrop, onDragEnd, onMove }: OrganizePageCardProps) {
    const orderChanged = originalIndex !== currentIndex;

    return (
        <div
            draggable
            className={cn(
                "group/card flex flex-col gap-1.5 cursor-grab active:cursor-grabbing transition-opacity [content-visibility:auto] [contain-intrinsic-size:240px]",
                isDragSource && "opacity-30",
            )}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            onDragStart={onDragStart}
            onDrop={onDrop}
        >
            <div className="relative aspect-3/4 overflow-hidden rounded-md border border-app-border bg-app-bg">
                <PdfPageThumbnail data={pageData} />
                <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 transition-opacity group-hover/card:opacity-100">
                    <button
                        aria-label={`Move page ${currentIndex + 1} up`}
                        className="flex h-5 w-5 items-center justify-center rounded bg-black/60 text-neutral-300 hover:bg-black/80 hover:text-white disabled:opacity-30"
                        disabled={currentIndex === 0}
                        type="button"
                        onClick={() => onMove(-1)}
                    >
                        <RiArrowUpLine className="size-3" />
                    </button>
                    <button
                        aria-label={`Move page ${currentIndex + 1} down`}
                        className="flex h-5 w-5 items-center justify-center rounded bg-black/60 text-neutral-300 hover:bg-black/80 hover:text-white disabled:opacity-30"
                        disabled={currentIndex === pageCount - 1}
                        type="button"
                        onClick={() => onMove(1)}
                    >
                        <RiArrowDownLine className="size-3" />
                    </button>
                </div>
                <div className="pointer-events-none absolute bottom-1 left-1 flex h-5 w-5 items-center justify-center rounded bg-black/50">
                    <RiDragMove2Line className="size-3 text-neutral-400" />
                </div>
            </div>
            <span className="truncate text-center text-[10px] text-neutral-500">
                Page {currentIndex + 1}
                {orderChanged && <span className="ml-1 text-neutral-700">(was {originalIndex + 1})</span>}
            </span>
        </div>
    );
}
