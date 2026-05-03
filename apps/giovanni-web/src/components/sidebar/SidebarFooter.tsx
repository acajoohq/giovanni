import * as React from "react";
import { cn } from "../../lib/utils";

export const SidebarFooter = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("mt-auto p-4 border-t border-[#282828] flex flex-col gap-2 bg-[#181818]", className)} {...props}>
        {children}
    </div>
);
