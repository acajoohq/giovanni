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
                <div className="px-3 py-2 bg-[#222] border-y border-[#333] flex justify-between items-center">
                    <span className="text-[11px] font-bold text-neutral-200 tracking-wide uppercase">Compression Profile</span>
                </div>
                <div className="p-4 flex flex-col gap-3 bg-[#181818]">
                    <div className="flex flex-col gap-2">
                        <button className="flex items-center justify-between p-2 rounded-[4px] border border-[#eb5a3f]/50 bg-[#eb5a3f]/10 transition-colors shadow-sm cursor-pointer text-left">
                            <div className="flex flex-col">
                                <span className="text-[12px] font-medium text-[#eb5a3f]">Balanced</span>
                            </div>
                            <div className="size-3 rounded-full border-[3px] border-[#eb5a3f]"></div>
                        </button>
                        <button className="flex items-center justify-between p-2 rounded-[4px] border border-[#282828] bg-[#111] hover:bg-[#222] transition-colors cursor-pointer text-left">
                            <div className="flex flex-col">
                                <span className="text-[12px] font-medium text-white">Minimum Size</span>
                            </div>
                            <div className="size-3 rounded-full border border-neutral-600 bg-[#111]"></div>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col border-b border-[#282828]">
                <div className="px-3 py-2 bg-[#222] border-y border-[#333] flex justify-between items-center">
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

    return (
        <ToolLayout title="Compress PDF" actionText="Compress" sidebar={sidebar}>
            <div className="flex-1 rounded-3xl border-2 border-dashed border-white/10 bg-[#1c1c1e]/40 flex flex-col p-6 hover:border-white/20 transition-colors overflow-y-auto items-center justify-center">
                {/* Visual Representation of the PDF */}
                <div className="w-full max-w-sm p-6 rounded-3xl bg-[#252525] border border-white/5 shadow-lg flex flex-col items-center text-center relative overflow-hidden">
                    <div className="absolute -right-6 -top-6 size-24 bg-[#eb5a3f] opacity-10 rounded-full blur-2xl pointer-events-none"></div>

                    <div className="size-16 rounded-full bg-[#111] shadow-skeuo-inner border border-black/50 flex items-center justify-center text-[#eb5a3f] mb-4">
                        <RiFilePdfLine className="size-8" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-1">heavy-presentation-deck.pdf</h3>
                    <p className="text-[13px] text-neutral-500 mb-6">85 pages • 45.2 MB</p>

                    <div className="w-full p-4 rounded-2xl bg-black/20 border border-white/5 flex items-center gap-4 text-left">
                        <RiImageLine className="size-6 text-neutral-600 flex-shrink-0" />
                        <div className="flex flex-col">
                            <span className="text-[13px] font-medium text-white">Images found</span>
                            <span className="text-[12px] text-neutral-500">Most size comes from uncompressed images</span>
                        </div>
                    </div>
                </div>

                <p className="text-[13px] text-neutral-500 mt-8">Drag a different file here to replace</p>
            </div>
        </ToolLayout>
    );
}
