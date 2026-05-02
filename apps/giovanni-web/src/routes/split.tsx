import { createFileRoute } from "@tanstack/react-router";
import { ToolLayout } from "../components/tool-layout";
import { RiAddLine, RiScissorsCutLine, RiInformationLine } from "@remixicon/react";
import { Input } from "../components/ui/input";

export const Route = createFileRoute("/split")({
    component: SplitRoute,
});

function SplitRoute() {
    const sidebar = (
        <div className="p-5 flex flex-col gap-6 h-full">
            <div className="flex flex-col gap-4">
                <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">Split Mode</label>
                <div className="flex p-1 bg-[#0a0a0a] border border-[#222] rounded-lg shadow-inner opacity-40 pointer-events-none">
                    <button className="flex-1 py-1.5 rounded-md shadow-sm bg-[#222] border border-[#333] text-white text-[12px] font-medium transition-all">Range</button>
                    <button className="flex-1 py-1.5 rounded-md text-neutral-500 hover:text-white text-[12px] font-medium transition-colors">Fixed Size</button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 opacity-40 pointer-events-none">
                <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-medium text-neutral-400">From Page</label>
                    <Input defaultValue="" type="number" disabled className="h-9 px-3 rounded-md bg-[#0a0a0a] border-[#222] text-[12px] text-white shadow-inner" />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-medium text-neutral-400">To Page</label>
                    <Input defaultValue="" type="number" disabled className="h-9 px-3 rounded-md bg-[#0a0a0a] border-[#222] text-[12px] text-white shadow-inner" />
                </div>
            </div>

            <div className="flex flex-col gap-4 pt-6 border-t border-[#1f1f1f] opacity-40 pointer-events-none">
                <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">Output Settings</label>
                <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-medium text-neutral-400">Filename Pattern</label>
                    <Input defaultValue="{basename}_split.pdf" disabled className="h-9 px-3 rounded-md bg-[#0a0a0a] border-[#222] text-[12px] text-white shadow-inner" />
                </div>
            </div>

            <div className="mt-auto pt-6">
                <div className="p-3 rounded-lg bg-[#111] border border-white/5 flex gap-3 items-start shadow-inner">
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
