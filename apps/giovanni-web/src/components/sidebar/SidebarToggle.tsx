import * as React from "react";
import { cn } from "../../lib/utils";

export const SidebarToggle = ({
    className,
    isActive,
    children,
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { isActive?: boolean }) => (
    <button
        type="button"
        className={cn(
            "flex-1 py-1 rounded-[3px] text-[11px] font-medium transition-all",
            isActive
                ? "bg-[#333] shadow-sm text-white"
                : "text-neutral-500 hover:text-white",
            className
        )}
        {...props}
    >
        {children}
    </button>
);
