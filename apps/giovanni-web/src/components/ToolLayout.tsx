import type * as React from "react";
import { Button } from "./shadcn-ui/Button";

interface ToolLayoutProps {
    title: string;
    actionText: string;
    isActionDisabled?: boolean;
    isActionBusy?: boolean;
    onAction?: () => void;
    sidebar: React.ReactNode;
    children: React.ReactNode;
}

export function ToolLayout({ title, actionText, isActionDisabled, isActionBusy, onAction, sidebar, children }: ToolLayoutProps) {
    return (
        <div className="flex h-full w-full bg-[#0a0a0a] text-[#ededed]">
            {/* Main Area (Canvas / Empty State) */}
            <div className="flex-1 flex flex-col overflow-hidden relative bg-[#0f0f0f] border-r border-[#1f1f1f]">
                <div
                    className="absolute inset-0 pointer-events-none opacity-20"
                    style={{ backgroundImage: "radial-gradient(circle at center, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "16px 16px" }}
                />
                <div className="relative z-10 flex-1 overflow-y-auto w-full h-full custom-scrollbar flex items-center justify-center p-8">{children}</div>
            </div>

            {/* Right Sidebar (Inspector) */}
            <aside className="w-[320px] flex-shrink-0 bg-[#181818] flex flex-col z-10 shadow-[-8px_0_24px_rgba(0,0,0,0.5)] border-l border-[#282828]">
                <div className="px-4 py-2 border-b border-[#282828] bg-[#222]">
                    <h2 className="text-[12px] font-semibold text-neutral-300 tracking-wide">{title}</h2>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">{sidebar}</div>

                <div className="p-3 border-t border-[#282828] bg-[#181818]">
                    <Button
                        className="w-full h-8 rounded-[4px] bg-[#eb5a3f] hover:bg-[#d65037] text-[12px] font-medium shadow-sm border border-black/20 text-white transition-all"
                        disabled={isActionDisabled || isActionBusy}
                        onClick={onAction}
                    >
                        {isActionBusy ? "Working..." : actionText}
                    </Button>
                </div>
            </aside>
        </div>
    );
}
