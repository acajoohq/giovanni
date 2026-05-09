import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const SidebarToggle = ({ className, isActive, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { isActive?: boolean }) => (
    <button
        type="button"
        className={cn(
            "flex-1 py-1 rounded-[3px] text-[11px] font-medium transition-all",
            isActive
                ? "bg-white shadow-skeuo-sm text-foreground dark:bg-[#303030] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] dark:text-foreground"
                : "text-muted-foreground hover:text-foreground",
            className,
        )}
        {...props}
    >
        {children}
    </button>
);
