import * as React from "react";
import { cn } from "../../lib/utils";

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
    title: React.ReactNode;
    description: React.ReactNode;
    badgeIcon?: React.ReactNode;
    visual: React.ReactNode;
    isMultiple?: boolean;
    accept?: string;
    inputRef?: React.Ref<HTMLInputElement>;
    onFiles?: (files: File[]) => void;
}

export const EmptyState = ({ className, title, description, badgeIcon, visual, isMultiple, accept, inputRef, onFiles, ...props }: EmptyStateProps) => {
    const [isDragOver, setIsDragOver] = React.useState(false);
    const dragCounterRef = React.useRef(0);

    const handleFiles = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        onFiles?.(Array.from(files));
    };

    const handleDragEnter = (event: React.DragEvent) => {
        if (!onFiles) return;
        event.preventDefault();
        dragCounterRef.current += 1;
        setIsDragOver(true);
    };

    const handleDragLeave = (event: React.DragEvent) => {
        if (!onFiles) return;
        event.preventDefault();
        dragCounterRef.current -= 1;
        if (dragCounterRef.current === 0) setIsDragOver(false);
    };

    const handleDragOver = (event: React.DragEvent) => {
        if (!onFiles) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
    };

    const handleDrop = (event: React.DragEvent) => {
        if (!onFiles) return;
        event.preventDefault();
        dragCounterRef.current = 0;
        setIsDragOver(false);
        handleFiles(event.dataTransfer.files);
    };

    return (
        <div
            className={cn("relative flex h-full w-full flex-col items-center justify-center text-center transition-colors duration-150", isDragOver && "bg-[#eb5a3f]/5", className)}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            {...props}
        >
            {isDragOver && <div className="pointer-events-none absolute inset-4 rounded-xl border-2 border-dashed border-[#eb5a3f]/40" />}

            <label className="relative mb-10 block cursor-pointer group">
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    multiple={isMultiple}
                    accept={accept}
                    onChange={(event) => {
                        handleFiles(event.currentTarget.files);
                        event.currentTarget.value = "";
                    }}
                />
                <div className="relative flex size-32 items-center justify-center">{visual}</div>

                {badgeIcon && (
                    <div className="absolute -bottom-2 -right-2 z-30 flex size-10 items-center justify-center rounded-full border border-[#333] bg-[#1a1a1a] text-neutral-400 shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] transition-colors group-hover:text-white">
                        {badgeIcon}
                    </div>
                )}
            </label>

            <h2 className="mb-1.5 text-[15px] font-medium tracking-tight text-white">{title}</h2>
            <p className="text-[12px] text-neutral-500">{description}</p>
        </div>
    );
};
