import * as React from "react";
import { RiUploadCloud2Line } from "@remixicon/react";
import { Button } from "./shadcn-ui/Button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./shadcn-ui/Resizable";

interface ToolLayoutProps {
    title: string;
    actionText: string;
    isActionDisabled?: boolean;
    isActionBusy?: boolean;
    onAction?: () => void;
    sidebar: React.ReactNode;
    children: React.ReactNode;
    footerSlot?: React.ReactNode;
    onFiles?: (files: File[]) => void;
    isMultiple?: boolean;
}

export function ToolLayout({ title, actionText, isActionDisabled, isActionBusy, onAction, sidebar, children, footerSlot, onFiles, isMultiple }: ToolLayoutProps) {
    const [isDragOver, setIsDragOver] = React.useState(false);
    const dragCounter = React.useRef(0);

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        dragCounter.current++;
        if (dragCounter.current === 1) setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        dragCounter.current--;
        if (dragCounter.current === 0) setIsDragOver(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        dragCounter.current = 0;
        setIsDragOver(false);
        if (!onFiles) return;
        onFiles(Array.from(e.dataTransfer.files));
    };

    return (
        <ResizablePanelGroup className="h-full w-full bg-[#0a0a0a] text-[#ededed]" direction="horizontal">
            <ResizablePanel defaultSize={85} minSize={40}>
                <div
                    className="relative h-full overflow-hidden bg-[#0f0f0f]"
                    onDragEnter={onFiles ? handleDragEnter : undefined}
                    onDragLeave={onFiles ? handleDragLeave : undefined}
                    onDragOver={onFiles ? handleDragOver : undefined}
                    onDrop={onFiles ? handleDrop : undefined}
                >
                    <div
                        className="pointer-events-none absolute inset-0 opacity-20"
                        style={{
                            backgroundImage: "radial-gradient(circle at center, rgba(255,255,255,0.05) 1px, transparent 1px)",
                            backgroundSize: "16px 16px",
                        }}
                    />
                    <div className="relative z-10 h-full w-full overflow-hidden">{children}</div>

                    {isDragOver && (
                        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_50%,rgba(235,90,63,0.07),transparent)]" />
                            <div className="relative flex flex-col items-center gap-4">
                                <div className="flex size-16 items-center justify-center rounded-2xl border border-[#eb5a3f]/20 bg-[#eb5a3f]/10 shadow-[0_0_48px_rgba(235,90,63,0.18)]">
                                    <RiUploadCloud2Line className="size-8 text-[#eb5a3f]" />
                                </div>
                                <p className="text-[14px] font-semibold text-white/90">
                                    Drop {isMultiple ? "files" : "a file"} here
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel defaultSize={15} maxSize={35} minSize={12}>
                <aside className="flex h-full flex-col border-l border-[#282828] bg-[#181818] shadow-[-8px_0_24px_rgba(0,0,0,0.5)]">
                    <div className="shrink-0 border-b border-[#282828] bg-[#222] px-4 py-2">
                        <h2 className="text-[12px] font-semibold tracking-wide text-neutral-300">{title}</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto">{sidebar}</div>

                    <div className="shrink-0 border-t border-[#282828]">
                        {footerSlot && <div className="border-b border-[#282828] p-3">{footerSlot}</div>}
                        <div className="p-3">
                            <Button
                                className="h-8 w-full rounded-[4px] border border-black/20 bg-[#eb5a3f] text-[12px] font-medium text-white shadow-sm transition-all hover:bg-[#d65037]"
                                disabled={isActionDisabled || isActionBusy}
                                onClick={onAction}
                            >
                                {isActionBusy ? "Working..." : actionText}
                            </Button>
                        </div>
                    </div>
                </aside>
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}
