import * as React from "react";
import { cn } from "../../lib/utils";

export const SidebarField = ({ className, label, children, ...props }: React.HTMLAttributes<HTMLDivElement> & { label: React.ReactNode }) => (
    <div className={cn("grid grid-cols-[100px_1fr] items-center gap-2", className)} {...props}>
        <label className="text-[12px] text-neutral-400">{label}</label>
        {children}
    </div>
);
