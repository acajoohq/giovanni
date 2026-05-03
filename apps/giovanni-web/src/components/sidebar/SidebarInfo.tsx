import * as React from "react";
import { cn } from "../../lib/utils";
import { RiInformationLine } from "@remixicon/react";

export const SidebarInfo = ({
    className,
    children,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div className="mt-auto p-4">
        <div className={cn("p-3 rounded-[4px] bg-[#111] border border-[#282828] flex gap-2 items-start", className)} {...props}>
            <RiInformationLine className="size-4 text-neutral-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-neutral-400 leading-relaxed">{children}</p>
        </div>
    </div>
);
