import * as React from "react";
import { cn } from "../../lib/utils";

export const SidebarSection = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex flex-col border-b border-[#282828]", className)} {...props}>
        {children}
    </div>
);
