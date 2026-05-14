import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const SidebarCheckbox = ({ className, label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) => (
    <label className={cn("my-2 flex items-start justify-between gap-3 cursor-pointer group", className)}>
        <span className="flex-1 text-[12px] leading-snug text-muted-foreground transition-colors group-hover:text-app-text-muted">{label}</span>
        <input
            type="checkbox"
            className="mt-0.5 size-3.5 shrink-0 rounded border border-neutral-300 bg-neutral-100 accent-brand shadow-[inset_0_1px_1px_rgba(0,0,0,0.08)] dark:border-app-border dark:bg-app-control dark:shadow-[inset_0_1px_1px_rgba(0,0,0,0.5)]"
            {...props}
        />
    </label>
);
