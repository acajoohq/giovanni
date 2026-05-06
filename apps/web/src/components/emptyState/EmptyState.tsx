import { useRef, useState, type DragEvent, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
    title: ReactNode;
    description: ReactNode;
    badgeIcon?: ReactNode;
    visual: ReactNode;
    fileInputId: string;
    onFiles?: (files: File[]) => void;
}

export const EmptyState = ({ className, title, description, badgeIcon, visual, fileInputId, onFiles, ...props }: EmptyStateProps) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const dragCounterRef = useRef(0);

    const handleFiles = (files?: FileList) => {
        if (!files || files.length === 0) return;
        onFiles?.(Array.from(files));
    };

    const handleDragEnter = (event: DragEvent) => {
        if (!onFiles) return;
        event.preventDefault();
        event.stopPropagation();
        dragCounterRef.current += 1;
        setIsDragOver(true);
    };

    const handleDragLeave = (event: DragEvent) => {
        if (!onFiles) return;
        event.preventDefault();
        event.stopPropagation();
        dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
        if (dragCounterRef.current < 1) setIsDragOver(false);
    };

    const handleDragOver = (event: DragEvent) => {
        if (!onFiles) return;
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = "copy";
    };

    const handleDrop = (event: DragEvent) => {
        if (!onFiles) return;
        event.preventDefault();
        event.stopPropagation();
        dragCounterRef.current = 0;
        setIsDragOver(false);
        handleFiles(event.dataTransfer.files);
    };

    return (
        <div
            className={cn("relative flex h-full w-full flex-col items-center justify-center text-center transition-colors duration-150", isDragOver && "bg-brand/5", className)}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            {...props}
        >
            {isDragOver && <div className="pointer-events-none absolute inset-4 rounded-xl border-2 border-dashed border-brand/40" />}

            <label className="group relative flex cursor-pointer flex-col items-center" htmlFor={fileInputId}>
                <div className="relative mb-10 flex size-32 items-center justify-center">{visual}</div>

                {badgeIcon && (
                    <div className="absolute left-[calc(50%+34px)] top-[86px] z-30 flex size-10 items-center justify-center rounded-full border border-app-border-strong bg-app-surface-muted text-neutral-400 shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] transition-colors group-hover:text-white">
                        {badgeIcon}
                    </div>
                )}

                <h2 className="mb-1.5 text-[15px] font-medium tracking-tight text-white transition-colors group-hover:text-brand">{title}</h2>
                <p className="text-[12px] text-neutral-500">{description}</p>
            </label>
        </div>
    );
};
