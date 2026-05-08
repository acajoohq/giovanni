import { RiSortAsc } from "@remixicon/react";

export function EmptyOrganize() {
    return (
        <div className="absolute inset-0 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
            <div className="relative h-20 w-16">
                <div className="absolute inset-0 rounded-xl border border-app-border-stronger bg-linear-to-b from-app-panel-strong to-app-border shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]">
                    <div className="absolute right-0 top-0 h-4 w-4 rounded-bl-sm bg-linear-to-bl from-white/20 to-transparent shadow-sm" />
                </div>
                <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-brand drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-125">
                    <RiSortAsc className="size-6" />
                </div>
            </div>
        </div>
    );
}
