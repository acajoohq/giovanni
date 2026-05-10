import { useState } from "react";
import { RiArrowDownSLine } from "@remixicon/react";
import { cn } from "@/lib/utils";
import { SidebarSection } from "./SidebarSection";

interface Props {
    title: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
}

export function SidebarCollapsibleSection({ title, defaultOpen = false, children }: Props) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <SidebarSection>
            <button
                className="flex w-full items-center justify-between border-y border-app-border-strong bg-app-panel-strong px-4 py-2 text-left"
                type="button"
                onClick={() => setIsOpen((v) => !v)}
            >
                <span className="text-[10px] font-bold uppercase tracking-wide">{title}</span>
                <RiArrowDownSLine className={cn("size-3.5 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
            </button>
            <div className={cn("grid transition-[grid-template-rows] duration-200", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                <div className="overflow-hidden">{children}</div>
            </div>
        </SidebarSection>
    );
}
