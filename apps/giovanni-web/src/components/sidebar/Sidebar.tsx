import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Sidebar = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex flex-col h-full bg-app-panel text-app-text-muted", className)} {...props}>
        {children}
    </div>
);
