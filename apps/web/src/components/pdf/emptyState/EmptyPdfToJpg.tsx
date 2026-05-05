import { RiImage2Line } from "@remixicon/react";

export function EmptyPdfToJpg() {
    return (
        <>
            <div className="absolute h-24 w-18 -rotate-6 rounded-xl border border-app-border-strong bg-app-surface shadow-[0_14px_30px_rgba(0,0,0,0.35)] transition-transform duration-500 group-hover:-translate-x-2 group-hover:-rotate-12" />
            <div className="absolute h-24 w-18 rotate-6 rounded-xl border border-brand-soft bg-linear-to-br from-brand to-brand-deep shadow-brand-card transition-transform duration-500 group-hover:translate-x-2 group-hover:rotate-12" />
            <div className="relative z-10 flex size-14 items-center justify-center rounded-2xl border border-white/15 bg-black/30 text-white/90 shadow-[inset_0_1px_1px_rgba(255,255,255,0.16)]">
                <RiImage2Line className="size-7" />
            </div>
        </>
    );
}
