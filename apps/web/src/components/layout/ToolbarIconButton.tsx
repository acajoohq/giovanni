import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const toolbarIconButtonClass =
    "flex size-7 items-center justify-center rounded-[6px] text-app-text-subtle transition-colors hover:bg-app-control-hover hover:text-app-text focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:outline-none";

export function ToolbarIconButton({ className, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
    return <button className={cn(toolbarIconButtonClass, className)} type={type} {...props} />;
}
