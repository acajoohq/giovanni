import { RiScissorsCutLine } from "@remixicon/react";

export function SplitVisual() {
    return (
        <div className="absolute inset-0 flex items-center justify-center transition-transform duration-500 group-hover:rotate-6">
            <div className="relative h-20 w-16">
                <div className="absolute left-0 right-0 top-0 z-10 h-[38px] origin-bottom overflow-hidden rounded-t-xl border border-app-border-stronger border-b-dashed bg-linear-to-b from-app-border to-app-panel-strong shadow-[0_5px_10px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)] transition-transform duration-500 group-hover:-translate-y-3 group-hover:-rotate-3">
                    <div className="absolute right-0 top-0 h-4 w-4 rounded-bl-sm bg-linear-to-bl from-white/20 to-transparent shadow-sm" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 z-10 h-[38px] origin-top rounded-b-xl border border-app-border-stronger border-t-0 bg-linear-to-t from-app-border to-app-panel-strong shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_-1px_1px_rgba(255,255,255,0.1)] transition-transform duration-500 group-hover:translate-y-3 group-hover:rotate-3" />
                <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 text-brand drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-125">
                    <RiScissorsCutLine className="size-6" />
                </div>
            </div>
        </div>
    );
}
