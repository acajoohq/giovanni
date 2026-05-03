import * as React from "react";
import { cn } from "../../lib/utils";

export const SidebarHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("px-4 py-2 bg-[#222] border-y border-[#333] flex justify-between items-center", className)} {...props}>
        <span className="text-[11px] font-bold text-neutral-200 tracking-wide uppercase">{children}</span>
    </div>
);
