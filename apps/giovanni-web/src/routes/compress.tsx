import { createFileRoute } from "@tanstack/react-router";
import { ToolLayout } from "../components/tool-layout";
import { RiFilePdfLine, RiImageLine, RiFileZipLine, RiAddLine, RiInformationLine } from "@remixicon/react";
import { Input } from "../components/ui/input";

export const Route = createFileRoute("/compress")({
    component: CompressRoute,
});

function CompressRoute() {
    const sidebar = (
        <div className="flex flex-col h-full bg-[#181818] text-[#d4d4d4]">
            <div className="flex flex-col border-b border-[#282828]">
                <div className="px-4 py-2 bg-[#222] border-y border-[#333] flex justify-between items-center">
                    <span className="text-[11px] font-bold text-neutral-200 tracking-wide uppercase">Compression</span>
                </div>
                <div className="p-4 flex flex-col gap-3 bg-[#181818]">
                    <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                        <label className="text-[12px] text-neutral-400">Profile</label>
                        <div className="flex bg-[#111] border border-[#282828] rounded-[4px] p-0.5">
                            <button className="flex-1 py-1 rounded-[3px] bg-[#333] shadow-sm text-white text-[11px] font-medium transition-all">Balanced</button>
                            <button className="flex-1 py-1 rounded-[3px] text-neutral-500 hover:text-white text-[11px] font-medium transition-colors">Extreme</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col border-b border-[#282828]">
                <div className="px-4 py-2 bg-[#222] border-y border-[#333] flex justify-between items-center">
                    <span className="text-[11px] font-bold text-neutral-200 tracking-wide uppercase">Image Settings</span>
                </div>
                <div className="p-4 flex flex-col gap-3 bg-[#181818]">
                    <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                        <label className="text-[12px] text-neutral-400">DPI</label>
                        <Input
                            defaultValue="144"
                            type="number"
                            className="h-7 px-2 rounded-[4px] bg-[#111] border-[#282828] text-[12px] text-white focus-visible:ring-1 focus-visible:ring-[#eb5a3f] shadow-inner"
                        />
                    </div>
                    <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                        <label className="text-[12px] text-neutral-400">Quality (%)</label>
                        <Input
                            defaultValue="65"
                            type="number"
                            className="h-7 px-2 rounded-[4px] bg-[#111] border-[#282828] text-[12px] text-white focus-visible:ring-1 focus-visible:ring-[#eb5a3f] shadow-inner"
                        />
                    </div>
                    
                    <label className="grid grid-cols-[100px_1fr] items-center gap-2 cursor-pointer group mt-1">
                        <span className="text-[12px] text-neutral-400 group-hover:text-neutral-300 transition-colors">Grayscale</span>
                        <input type="checkbox" className="accent-[#eb5a3f] size-3.5 rounded bg-[#111] border-[#282828]" />
                    </label>
                </div>
            </div>

            <div className="mt-auto p-4 border-t border-[#282828] flex flex-col gap-2 bg-[#181818]">
                <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-500">Original Size</span>
                    <span className="text-neutral-300">45.2 MB</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-500">Est. New Size</span>
                    <span className="text-[#eb5a3f] font-medium">~8.5 MB</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-500">Savings</span>
                    <span className="text-[#eb5a3f] font-medium">81%</span>
                </div>
            </div>
        </div>
    );

    const emptyState = (
        <div className="flex flex-col items-center justify-center text-center">
            <label className="relative mb-10 group cursor-pointer block">
                <input type="file" className="hidden" />
                <div className="relative size-32 flex items-center justify-center">
                    {/* Vise / Clamp background */}
                    <div className="absolute inset-x-0 h-24 bg-[#111] border border-[#222] rounded-3xl shadow-[inset_0_10px_20px_rgba(0,0,0,0.5)] transform scale-95 transition-transform duration-500 group-hover:scale-100 flex items-center justify-between px-2">
                        <div className="w-2 h-12 bg-[#222] rounded-full shadow-[inset_1px_0_2px_rgba(255,255,255,0.1)]"></div>
                        <div className="w-2 h-12 bg-[#222] rounded-full shadow-[inset_-1px_0_2px_rgba(255,255,255,0.1)]"></div>
                    </div>

                    {/* File being squeezed */}
                    <div className="relative w-16 h-20 bg-gradient-to-br from-[#eb5a3f] to-[#b33e29] rounded-xl shadow-[0_10px_20px_rgba(235,90,63,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-[#ff7b63] flex flex-col items-center justify-center transition-all duration-500 group-hover:scale-95 group-hover:w-14 z-10">
                        <RiFileZipLine className="size-6 text-white/90 drop-shadow-md" />
                        {/* Page fold */}
                        <div className="absolute top-0 right-0 w-4 h-4 bg-gradient-to-bl from-white/40 to-transparent rounded-bl-lg shadow-sm"></div>
                    </div>
                </div>

                {/* Add badge */}
                <div className="absolute -bottom-2 -right-2 size-10 rounded-full bg-[#1a1a1a] shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] border border-[#333] flex items-center justify-center text-neutral-400 group-hover:text-white transition-colors z-20">
                    <RiAddLine className="size-5" />
                </div>
            </label>

            <h2 className="text-[15px] font-medium text-white tracking-tight mb-1.5">Drop a PDF to compress</h2>
            <p className="text-[12px] text-neutral-500">Secure, offline processing.</p>
        </div>
    );

    return (
        <ToolLayout title="Compress PDF" actionText="Compress" sidebar={sidebar}>
            {emptyState}
        </ToolLayout>
    );
}
