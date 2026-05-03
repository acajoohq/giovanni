import { createFileRoute } from "@tanstack/react-router";
import { ToolLayout } from "../components/tool-layout";
import { RiAddLine, RiScissorsCutLine, RiInformationLine } from "@remixicon/react";
import { Input } from "../components/ui/input";

export const Route = createFileRoute("/split")({
    component: SplitRoute,
});

function SplitRoute() {
    const sidebar = (
        <div className="flex flex-col h-full bg-[#181818] text-[#d4d4d4]">
            <div className="flex flex-col border-b border-[#282828]">
                <div className="px-3 py-2 bg-[#222] border-y border-[#333] flex justify-between items-center">
                    <span className="text-[11px] font-bold text-neutral-200 tracking-wide uppercase">Split Settings</span>
                </div>
                <div className="p-4 flex flex-col gap-3 bg-[#181818]">
                    <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                        <label className="text-[12px] text-neutral-400">Mode</label>
                        <div className="flex bg-[#111] border border-[#282828] rounded-[4px] p-0.5">
                            <button className="flex-1 py-1 rounded-[3px] bg-[#333] shadow-sm text-white text-[11px] font-medium transition-all">Range</button>
                            <button className="flex-1 py-1 rounded-[3px] text-neutral-500 hover:text-white text-[11px] font-medium transition-colors">Fixed Size</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                        <label className="text-[12px] text-neutral-400">From Page</label>
                        <Input defaultValue="1" type="number" className="h-7 px-2 rounded-[4px] bg-[#111] border-[#282828] text-[12px] text-white focus-visible:ring-1 focus-visible:ring-[#eb5a3f] shadow-inner" />
                    </div>
                    
                    <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                        <label className="text-[12px] text-neutral-400">To Page</label>
                        <Input defaultValue="1" type="number" className="h-7 px-2 rounded-[4px] bg-[#111] border-[#282828] text-[12px] text-white focus-visible:ring-1 focus-visible:ring-[#eb5a3f] shadow-inner" />
                    </div>
                </div>
            </div>

            <div className="flex flex-col border-b border-[#282828]">
                <div className="px-3 py-2 bg-[#222] border-y border-[#333] flex justify-between items-center">
                    <span className="text-[11px] font-bold text-neutral-200 tracking-wide uppercase">Output</span>
                </div>
                <div className="p-4 flex flex-col gap-3 bg-[#181818]">
                    <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                        <label className="text-[12px] text-neutral-400">Pattern</label>
                        <Input defaultValue="{basename}_split" className="h-7 px-2 rounded-[4px] bg-[#111] border-[#282828] text-[12px] text-white focus-visible:ring-1 focus-visible:ring-[#eb5a3f] shadow-inner" />
                    </div>
                </div>
            </div>

            <div className="mt-auto p-4">
                <div className="p-3 rounded-[4px] bg-[#111] border border-[#282828] flex gap-2 items-start">
                    <RiInformationLine className="size-4 text-neutral-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-neutral-400 leading-relaxed">Select a PDF file to enable split options and preview pages.</p>
                </div>
            </div>
        </div>
    );

    const emptyState = (
        <div className="flex flex-col items-center justify-center text-center">
            <label className="relative mb-10 group cursor-pointer block">
                <input type="file" className="hidden" />
                <div className="relative size-32 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-500">
                        <div className="relative w-16 h-20">
                            {/* Top half */}
                            <div className="absolute top-0 left-0 right-0 h-[38px] bg-gradient-to-b from-[#2a2a2a] to-[#222] rounded-t-xl shadow-[0_5px_10px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)] border border-[#444] border-b-dashed transition-transform duration-500 group-hover:-translate-y-3 group-hover:-rotate-3 origin-bottom z-10 flex items-center justify-center overflow-hidden">
                                <div className="absolute top-0 right-0 w-4 h-4 bg-gradient-to-bl from-white/20 to-transparent rounded-bl-sm shadow-sm"></div>
                            </div>
                            {/* Bottom half */}
                            <div className="absolute bottom-0 left-0 right-0 h-[38px] bg-gradient-to-t from-[#2a2a2a] to-[#222] rounded-b-xl shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_-1px_1px_rgba(255,255,255,0.1)] border border-[#444] border-t-0 flex items-end justify-center pb-2 transition-transform duration-500 group-hover:translate-y-3 group-hover:rotate-3 origin-top z-10"></div>
                            {/* Scissors */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#eb5a3f] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-125 z-20">
                                <RiScissorsCutLine className="size-6" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add badge */}
                <div className="absolute -bottom-2 -right-2 size-10 rounded-full bg-[#1a1a1a] shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] border border-[#333] flex items-center justify-center text-neutral-400 group-hover:text-white transition-colors z-30">
                    <RiAddLine className="size-5" />
                </div>
            </label>

            <h2 className="text-[15px] font-medium text-white tracking-tight mb-1.5">Drop a PDF to split</h2>
            <p className="text-[12px] text-neutral-500">Secure, offline processing.</p>
        </div>
    );

    return (
        <ToolLayout title="Split" actionText="Select PDF" sidebar={sidebar}>
            {emptyState}
        </ToolLayout>
    );
}
