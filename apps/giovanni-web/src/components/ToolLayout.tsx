import * as React from "react";
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
}

export function ToolLayout({ title, actionText, isActionDisabled, isActionBusy, onAction, sidebar, children, footerSlot }: ToolLayoutProps) {
    return (
        <ResizablePanelGroup className="h-full w-full bg-[#0a0a0a] text-[#ededed]" direction="horizontal">
            <ResizablePanel defaultSize={80} minSize={40}>
                <div className="relative h-full overflow-hidden bg-[#0f0f0f]">
                    <div
                        className="pointer-events-none absolute inset-0 opacity-20"
                        style={{
                            backgroundImage: "radial-gradient(circle at center, rgba(255,255,255,0.05) 1px, transparent 1px)",
                            backgroundSize: "16px 16px",
                        }}
                    />
                    <div className="relative z-10 h-full w-full overflow-hidden">{children}</div>
                </div>
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel defaultSize={20} maxSize={35} minSize={15}>
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
