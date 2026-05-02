import type * as React from "react";
import { Button } from "./ui/button";

interface ToolLayoutProps {
    title: string;
    actionText: string;
    sidebar: React.ReactNode;
    children: React.ReactNode;
}

export function ToolLayout({ title, actionText, sidebar, children }: ToolLayoutProps) {
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
            <aside className="w-[320px] flex-shrink-0 bg-[#141414] flex flex-col z-10 shadow-[-8px_0_24px_rgba(0,0,0,0.5)]">
                <div className="px-5 py-4 border-b border-[#1f1f1f] bg-[#141414]">
                    <h2 className="text-[12px] font-semibold text-white tracking-wide uppercase">{title}</h2>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">{sidebar}</div>

                <div className="p-4 border-t border-[#1f1f1f] bg-[#111111]">
                    <Button className="w-full h-10 rounded-lg bg-[#eb5a3f] hover:bg-[#d65037] text-[13px] font-medium shadow-[inset_0px_1px_0px_0px_rgba(255,255,255,0.2)] border border-black/20 text-white transition-all">
                        {actionText}
                    </Button>
                </div>
            </aside>
        </div>
    );
}
