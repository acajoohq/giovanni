import { RiFileZipLine } from "@remixicon/react";

export function EmptyCompress() {
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
