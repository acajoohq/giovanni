import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const SidebarToggleGroup = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "flex rounded-[4px] border p-0.5",
            "border-neutral-300 bg-neutral-200 shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)]",
            "dark:border-[#333] dark:bg-[#222] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]",
            className,
        )}
        {...props}
    >
        {children}
    </div>
);
