import * as React from "react";
import { cn } from "../../lib/utils";

export const SidebarToggleGroup = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex bg-[#111] border border-[#282828] rounded-[4px] p-0.5", className)} {...props}>
        {children}
    </div>
);
