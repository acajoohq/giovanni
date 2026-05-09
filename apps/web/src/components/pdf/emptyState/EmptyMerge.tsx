import { RiStackLine } from "@remixicon/react";

export function EmptyMerge() {
    return (
        <>
            <div className="absolute h-20 w-16 -translate-x-3 translate-y-1 -rotate-12 rounded-xl border border-neutral-300 bg-linear-to-br from-neutral-200 to-neutral-100 shadow-[0_10px_20px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.8)] transition-all duration-500 group-hover:-translate-x-5 group-hover:rotate-[-15deg] dark:border-neutral-600 dark:from-neutral-700 dark:to-neutral-800 dark:shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.06)]" />
            <div className="absolute h-20 w-16 translate-x-3 translate-y-1 rotate-6 rounded-xl border border-neutral-300 bg-linear-to-br from-neutral-300 to-neutral-200 shadow-[0_10px_20px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.8)] transition-all duration-500 group-hover:translate-x-5 group-hover:rotate-12 dark:border-neutral-500 dark:from-neutral-600 dark:to-neutral-700 dark:shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.08)]" />
            <div className="absolute z-10 flex h-20 w-16 flex-col items-center justify-center rounded-xl border border-brand-soft bg-linear-to-br from-brand to-brand-dark shadow-brand-card transition-transform duration-500 group-hover:scale-105">
                <RiStackLine className="size-6 text-white/90 drop-shadow-md" />
                <div className="absolute right-0 top-0 size-4 rounded-bl-lg bg-linear-to-bl from-white/40 to-transparent shadow-sm" />
            </div>
        </>
    );
}
