import * as React from "react";
import { cn } from "../../lib/utils";

export const SidebarContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("p-4 flex flex-col gap-3 bg-[#181818]", className)} {...props}>
        {children}
    </div>
);
