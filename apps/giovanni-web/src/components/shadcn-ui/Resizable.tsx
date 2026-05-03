import * as React from "react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { cn } from "../../lib/utils";

export const ResizablePanelGroup = PanelGroup;
export const ResizablePanel = Panel;

interface ResizableHandleProps extends React.ComponentProps<typeof PanelResizeHandle> {
    withHandle?: boolean;
}

export function ResizableHandle({ className, ...props }: Omit<ResizableHandleProps, "withHandle">) {
    return (
        <PanelResizeHandle
            className={cn(
                "relative w-[3px] shrink-0 bg-transparent transition-colors duration-200",
                "hover:bg-white/5 active:bg-[#eb5a3f]/20",
                "data-[panel-group-direction=vertical]:h-[3px] data-[panel-group-direction=vertical]:w-full",
                "cursor-col-resize data-[panel-group-direction=vertical]:cursor-row-resize",
                "focus-visible:outline-none focus-visible:bg-white/5",
                className,
            )}
            {...props}
        />
    );
}
