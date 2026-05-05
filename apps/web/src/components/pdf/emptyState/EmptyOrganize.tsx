import { RiDragMove2Line } from "@remixicon/react";

export function EmptyOrganize() {
    return (
        <div className="absolute inset-0 flex items-center justify-center transition-transform duration-500 group-hover:rotate-3">
            <div className="relative h-20 w-24">
                <div className="absolute left-7 top-5 h-14 w-11 rotate-6 rounded-lg border border-app-border-stronger bg-linear-to-b from-app-border to-app-panel-strong shadow-md transition-transform duration-500 group-hover:translate-x-2 group-hover:rotate-12" />
                <div className="absolute left-3 top-3 h-14 w-11 -rotate-3 rounded-lg border border-app-border-stronger bg-linear-to-b from-app-border to-app-panel-strong shadow-md transition-transform duration-500 group-hover:-translate-x-2 group-hover:-rotate-6" />
                <div className="absolute left-5 top-1 z-10 h-14 w-11 rounded-lg border border-app-border-stronger bg-linear-to-b from-app-border to-app-panel-strong shadow-[0_5px_10px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)]" />
                <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 text-brand drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-125">
                    <RiDragMove2Line className="size-5" />
                </div>
            </div>
        </div>
    );
}
