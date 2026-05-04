import { RiFileZipLine, RiImageLine, RiScissorsCutLine, RiStackLine } from "@remixicon/react";

export function CompressVisual() {
    return (
        <>
            <div className="absolute inset-x-0 flex h-24 items-center justify-between rounded-3xl border border-app-panel-strong bg-app-control px-2 shadow-[inset_0_10px_20px_rgba(0,0,0,0.5)]">
                <div className="h-12 w-2 rounded-full bg-app-panel-strong shadow-[inset_1px_0_2px_rgba(255,255,255,0.1)]" />
                <div className="h-12 w-2 rounded-full bg-app-panel-strong shadow-[inset_-1px_0_2px_rgba(255,255,255,0.1)]" />
            </div>
            <div className="relative z-10 flex h-20 w-16 flex-col items-center justify-center rounded-xl border border-brand-soft bg-linear-to-br from-brand to-brand-dark shadow-brand-card transition-all duration-500 group-hover:w-14 group-hover:scale-95">
                <RiFileZipLine className="size-6 text-white/90 drop-shadow-md" />
                <div className="absolute right-0 top-0 h-4 w-4 rounded-bl-lg bg-linear-to-bl from-white/40 to-transparent shadow-sm" />
            </div>
        </>
    );
}

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

export function MergeVisual() {
    return (
        <>
            <div className="absolute h-20 w-16 -translate-x-3 translate-y-1 -rotate-12 rounded-xl border border-app-border-strong bg-linear-to-br from-app-surface-muted to-app-control shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all duration-500 group-hover:-translate-x-5 group-hover:rotate-[-15deg]" />
            <div className="absolute h-20 w-16 translate-x-3 translate-y-1 rotate-6 rounded-xl border border-app-border-stronger bg-linear-to-br from-app-panel-strong to-app-surface-muted shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all duration-500 group-hover:translate-x-5 group-hover:rotate-12" />
            <div className="absolute z-10 flex h-20 w-16 flex-col items-center justify-center rounded-xl border border-brand-soft bg-linear-to-br from-brand to-brand-dark shadow-brand-card transition-transform duration-500 group-hover:scale-105">
                <RiStackLine className="size-6 text-white/90 drop-shadow-md" />
                <div className="absolute right-0 top-0 h-4 w-4 rounded-bl-lg bg-linear-to-bl from-white/40 to-transparent shadow-sm" />
            </div>
        </>
    );
}

export function ExtractImagesVisual() {
    return (
        <>
            <div className="absolute h-20 w-20 rounded-2xl border border-app-border-strong bg-app-surface shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_14px_30px_rgba(0,0,0,0.35)] transition-transform duration-500 group-hover:rotate-3" />
            <div className="absolute flex h-14 w-14 items-center justify-center rounded-xl border border-brand-soft bg-linear-to-br from-brand to-brand-deep shadow-[0_10px_22px_rgba(235,90,63,0.28)] transition-all duration-500 group-hover:scale-110">
                <RiImageLine className="size-7 text-white/90" />
            </div>
        </>
    );
}
