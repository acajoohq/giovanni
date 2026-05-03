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
    const handleFiles = (files: FileList | null) => {
        if (!files || files.length === 0) {
            return;
        }
        onFiles?.(Array.from(files));
    };

    return (
        <div className={cn("flex flex-col items-center justify-center text-center", className)} {...props}>
            <label
                className="relative mb-10 group cursor-pointer block"
                onDragOver={(event) => {
                    if (!onFiles) {
                        return;
                    }
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "copy";
                }}
                onDrop={(event) => {
                    if (!onFiles) {
                        return;
                    }
                    event.preventDefault();
                    handleFiles(event.dataTransfer.files);
                }}
            >
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
                <div className="relative size-32 flex items-center justify-center">{visual}</div>

                {badgeIcon && (
                    <div className="absolute -bottom-2 -right-2 size-10 rounded-full bg-[#1a1a1a] shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] border border-[#333] flex items-center justify-center text-neutral-400 group-hover:text-white transition-colors z-30">
                        {badgeIcon}
                    </div>
                )}
            </label>

            <h2 className="text-[15px] font-medium text-white tracking-tight mb-1.5">{title}</h2>
            <p className="text-[12px] text-neutral-500">{description}</p>
        </div>
    );
};
