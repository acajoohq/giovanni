import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const SidebarToggle = ({ className, isActive, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { isActive?: boolean }) => (
    <button
        type="button"
        className={cn(
            "flex-1 py-1 rounded-[3px] text-[11px] font-medium transition-all",
            isActive ? "bg-app-border-strong shadow-sm text-white" : "text-neutral-500 hover:text-white",
            className,
        )}
        {...props}
    >
        {children}
    </button>
);
