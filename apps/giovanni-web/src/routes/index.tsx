import { createFileRoute } from "@tanstack/react-router";
import { ToolLayout } from "../components/tool-layout";
import { RiAddLine, RiSettings4Line, RiInformationLine, RiFileZipLine } from "@remixicon/react";
import { Input } from "../components/ui/input";

export const Route = createFileRoute("/")({
    component: CompressRoute,
});

function CompressRoute() {
    const sidebar = (
        <div className="p-5 flex flex-col gap-6 h-full">
            <div className="flex flex-col gap-4">
                <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">Compression</label>
                <div className="flex flex-col gap-2 opacity-40 pointer-events-none">
                    <label className="flex items-start gap-3 p-3 rounded-lg border border-[#eb5a3f]/40 bg-[#eb5a3f]/5 cursor-pointer shadow-sm">
                        <input type="radio" name="profile" className="mt-0.5 accent-[#eb5a3f] bg-black/20 border-[#333]" defaultChecked />
                        <div className="flex flex-col">
                            <span className="text-[13px] font-medium text-[#eb5a3f]">Balanced</span>
                            <span className="text-[11px] text-[#eb5a3f]/70 mt-0.5 leading-tight">Good quality, smaller size.</span>
                        </div>
                    </label>
                    <label className="flex items-start gap-3 p-3 rounded-lg border border-[#222] bg-[#111] transition-colors cursor-pointer">
                        <input type="radio" name="profile" className="mt-0.5 accent-[#eb5a3f] bg-black/20 border-[#333]" />
                        <div className="flex flex-col">
                            <span className="text-[13px] font-medium text-white">Extreme</span>
                            <span className="text-[11px] text-neutral-500 mt-0.5 leading-tight">Max compression, visible artifacts.</span>
                        </div>
                    </label>
                </div>
            </div>

            <div className="flex flex-col gap-4 pt-6 border-t border-[#1f1f1f]">
                <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">Advanced Options</label>
                    <RiSettings4Line className="size-4 text-neutral-600" />
                </div>

                <div className="opacity-40 pointer-events-none flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-[12px] font-medium text-neutral-400">Image DPI</label>
                        <Input
                            defaultValue="144"
                            type="number"
                            className="h-9 px-3 rounded-md bg-[#0a0a0a] border-[#222] text-[12px] text-white shadow-inner focus-visible:ring-1 focus-visible:ring-[#eb5a3f]"
                        />
                    </div>

                    <label className="flex items-center justify-between p-2.5 rounded-md bg-[#0a0a0a] border border-[#222] cursor-pointer">
                        <span className="text-[12px] text-neutral-400">Convert to Grayscale</span>
                        <input type="checkbox" className="accent-[#eb5a3f] size-3.5 rounded bg-black/20 border-[#333]" />
                    </label>
                </div>
            </div>

            <div className="mt-auto pt-6">
                <div className="p-3 rounded-lg bg-[#111] border border-white/5 flex gap-3 items-start shadow-inner">
                    <RiInformationLine className="size-4 text-neutral-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-neutral-400 leading-relaxed">Select a PDF file to enable compression options and see estimated savings.</p>
                </div>
            </div>
        </div>
    );

    const emptyState = (
        <div className="flex flex-col items-center justify-center text-center">
            <label className="relative mb-8 group cursor-pointer block">
                <input type="file" className="hidden" />
                <div className="relative size-32 flex items-center justify-center">
                    {/* Vise / Clamp background */}
                    <div className="absolute inset-x-0 h-24 bg-[#111] border border-[#222] rounded-3xl shadow-[inset_0_10px_20px_rgba(0,0,0,0.5)] transform scale-95 transition-transform duration-500 group-hover:scale-100 flex items-center justify-between px-2">
                        <div className="w-2 h-12 bg-[#222] rounded-full shadow-[inset_1px_0_2px_rgba(255,255,255,0.1)]"></div>
                        <div className="w-2 h-12 bg-[#222] rounded-full shadow-[inset_-1px_0_2px_rgba(255,255,255,0.1)]"></div>
                    </div>

                    {/* File being squeezed */}
                    <div className="relative w-16 h-20 bg-gradient-to-br from-[#eb5a3f] to-[#b33e29] rounded-xl shadow-[0_10px_20px_rgba(235,90,63,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-[#ff7b63] flex flex-col items-center justify-center transition-all duration-500 group-hover:scale-95 group-hover:w-14">
                        <RiFileZipLine className="size-6 text-white/90 drop-shadow-md" />
                        {/* Page fold */}
                        <div className="absolute top-0 right-0 w-4 h-4 bg-gradient-to-bl from-white/40 to-transparent rounded-bl-lg shadow-sm"></div>
                    </div>
                </div>

                {/* Add badge */}
                <div className="absolute -bottom-2 -right-2 size-10 rounded-full bg-[#1a1a1a] shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] border border-[#333] flex items-center justify-center text-neutral-400 group-hover:text-white transition-colors z-10">
                    <RiAddLine className="size-5" />
                </div>
            </label>

            <h2 className="text-[15px] font-medium text-white tracking-tight mb-1.5">Drop a PDF to compress</h2>
            <p className="text-[12px] text-neutral-500">Secure, offline processing.</p>
        </div>
    );

    return (
        <ToolLayout title="Compress" actionText="Select PDF" sidebar={sidebar}>
            {emptyState}
        </ToolLayout>
    );
}
