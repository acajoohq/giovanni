import { RiImageLine } from "@remixicon/react";

export function EmptyExtractImages() {
    return (
        <>
            <div className="absolute h-20 w-20 rounded-2xl border border-app-border-strong bg-app-surface shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_14px_30px_rgba(0,0,0,0.35)] transition-transform duration-500 group-hover:rotate-3" />
            <div className="absolute flex h-14 w-14 items-center justify-center rounded-xl border border-brand-soft bg-linear-to-br from-brand to-brand-deep shadow-[0_10px_22px_rgba(235,90,63,0.28)] transition-all duration-500 group-hover:scale-110">
                <RiImageLine className="size-7 text-white/90" />
            </div>
        </>
    );
}
