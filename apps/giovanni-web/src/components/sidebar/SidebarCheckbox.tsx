import * as React from "react";
import { cn } from "@/lib/utils";

export const SidebarCheckbox = ({ className, label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode }) => (
    <label className={cn("grid grid-cols-[100px_1fr] items-center gap-2 cursor-pointer group mt-1", className)}>
        <span className="text-[12px] text-neutral-400 group-hover:text-neutral-300 transition-colors">{label}</span>
        <input type="checkbox" className="accent-brand size-3.5 rounded bg-app-control border-app-border" {...props} />
    </label>
);
