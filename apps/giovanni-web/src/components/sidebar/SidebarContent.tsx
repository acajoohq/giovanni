import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const SidebarContent = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("p-4 flex flex-col gap-3 bg-app-panel", className)} {...props}>
        {children}
    </div>
);
