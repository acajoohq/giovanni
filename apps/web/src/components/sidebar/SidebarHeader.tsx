import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const SidebarHeader = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("px-4 py-2 bg-app-panel-strong border-y border-app-border-strong flex justify-between items-center", className)} {...props}>
        <span className="text-[11px] font-bold text-app-text tracking-wide uppercase">{children}</span>
    </div>
);
