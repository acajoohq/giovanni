import { RiStackLine } from "@remixicon/react";

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
