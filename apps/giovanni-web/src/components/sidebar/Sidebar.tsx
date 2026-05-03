import * as React from "react";
import { cn } from "../../lib/utils";

export const Sidebar = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex flex-col h-full bg-[#181818] text-[#d4d4d4]", className)} {...props}>
        {children}
    </div>
);
