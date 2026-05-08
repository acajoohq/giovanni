import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const SidebarToggle = ({ className, isActive, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { isActive?: boolean }) => (
    <button
        type="button"
        className={cn(
            "flex-1 py-1 rounded-[3px] text-[11px] font-medium transition-all",
            isActive ? "bg-app-border-strong shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
            className,
        )}
        {...props}
    >
        {children}
    </button>
);
