import { createFileRoute } from "@tanstack/react-router";
import { ToolLayout } from "../components/tool-layout";
import { RiAddLine, RiStackLine, RiInformationLine } from "@remixicon/react";
import { Input } from "../components/ui/input";

export const Route = createFileRoute("/merge")({
    component: MergeRoute,
});

function MergeRoute() {
    const sidebar = (
        <div className="p-5 flex flex-col gap-6 h-full">
            <div className="flex flex-col gap-4 opacity-40 pointer-events-none">
                <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">Output Settings</label>
                <div className="flex flex-col gap-3">
                    <label className="text-[12px] font-medium text-neutral-400">Output filename</label>
                    <Input
                        defaultValue=""
                        disabled
                        className="h-9 px-3 rounded-md bg-[#0a0a0a] border-[#222] text-[12px] text-white shadow-inner focus-visible:ring-1 focus-visible:ring-[#eb5a3f]"
                    />
                </div>
            </div>

            <div className="flex flex-col gap-4 pt-6 border-t border-[#1f1f1f] opacity-40 pointer-events-none">
                <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">Advanced Options</label>
                <div className="flex flex-col gap-4">
                    <label className="flex items-center justify-between p-2.5 rounded-md bg-[#0a0a0a] border border-[#222]">
                        <span className="text-[12px] text-neutral-400">Add Bookmarks</span>
                        <input type="checkbox" className="accent-[#eb5a3f] size-3.5 rounded bg-black/20 border-[#333]" disabled />
                    </label>
                    <label className="flex items-center justify-between p-2.5 rounded-md bg-[#0a0a0a] border border-[#222]">
                        <span className="text-[12px] text-neutral-400">Normalize Page Sizes</span>
                        <input type="checkbox" className="accent-[#eb5a3f] size-3.5 rounded bg-black/20 border-[#333]" disabled />
                    </label>
                </div>
            </div>

            <div className="mt-auto pt-6">
                <div className="p-3 rounded-lg bg-[#111] border border-white/5 flex gap-3 items-start shadow-inner">
                    <RiInformationLine className="size-4 text-neutral-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-neutral-400 leading-relaxed">Select multiple PDF files to merge them into a single document.</p>
                </div>
            </div>
        </div>
    );

    const emptyState = (
        <div className="flex flex-col items-center justify-center text-center">
            <label className="relative mb-10 group cursor-pointer block">
                <input type="file" className="hidden" multiple />
                <div className="relative size-32 flex items-center justify-center">
                    {/* Back file */}
                    <div className="absolute w-16 h-20 bg-gradient-to-br from-[#1a1a1a] to-[#111] rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] border border-[#333] -rotate-12 -translate-x-3 translate-y-1 transition-all duration-500 group-hover:-rotate-[15deg] group-hover:-translate-x-5"></div>
                    {/* Middle file */}
                    <div className="absolute w-16 h-20 bg-gradient-to-br from-[#222] to-[#1a1a1a] rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] border border-[#444] rotate-6 translate-x-3 translate-y-1 transition-all duration-500 group-hover:rotate-12 group-hover:translate-x-5"></div>
                    {/* Front file */}
                    <div className="absolute w-16 h-20 bg-gradient-to-br from-[#eb5a3f] to-[#b33e29] rounded-xl shadow-[0_10px_20px_rgba(235,90,63,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-[#ff7b63] flex flex-col items-center justify-center z-10 transition-transform duration-500 group-hover:scale-105">
                        <RiStackLine className="size-6 text-white/90 drop-shadow-md" />
                        <div className="absolute top-0 right-0 w-4 h-4 bg-gradient-to-bl from-white/40 to-transparent rounded-bl-lg shadow-sm"></div>
                    </div>
                </div>

                {/* Add badge */}
                <div className="absolute -bottom-2 -right-2 size-10 rounded-full bg-[#1a1a1a] shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] border border-[#333] flex items-center justify-center text-neutral-400 group-hover:text-white transition-colors z-20">
                    <RiAddLine className="size-5" />
                </div>
            </label>

            <h2 className="text-[15px] font-medium text-white tracking-tight mb-1.5">Drop PDFs to merge</h2>
            <p className="text-[12px] text-neutral-500">Secure, offline processing.</p>
        </div>
    );

    return (
        <ToolLayout title="Merge" actionText="Select PDFs" sidebar={sidebar}>
            {emptyState}
        </ToolLayout>
    );
}
