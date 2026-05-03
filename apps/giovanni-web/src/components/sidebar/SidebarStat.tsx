import * as React from "react";
import { cn } from "../../lib/utils";

export const SidebarStat = ({
    className,
    label,
    value,
    isHighlight,
    ...props
}: React.HTMLAttributes<HTMLDivElement> & { label: React.ReactNode; value: React.ReactNode; isHighlight?: boolean }) => (
    <div className={cn("flex items-center justify-between text-[11px]", className)} {...props}>
        <span className="text-neutral-500">{label}</span>
        <span className={cn(isHighlight ? "text-[#eb5a3f] font-medium" : "text-neutral-300")}>{value}</span>
    </div>
);
