import * as React from "react";
import { cn } from "@/lib/utils";

export const SidebarField = ({ className, label, children, ...props }: React.HTMLAttributes<HTMLDivElement> & { label: React.ReactNode }) => (
    <div className={cn("flex flex-col gap-1.5", className)} {...props}>
        <label className="text-[10px] font-medium uppercase tracking-wide text-neutral-600">{label}</label>
        {children}
    </div>
);
