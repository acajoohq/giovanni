import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const SidebarToggleGroup = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex bg-app-control border border-app-border rounded-[4px] p-0.5", className)} {...props}>
        {children}
    </div>
);
