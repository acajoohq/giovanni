import * as React from "react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { cn } from "../../lib/utils";

export const ResizablePanelGroup = PanelGroup;
export const ResizablePanel = Panel;

interface ResizableHandleProps extends React.ComponentProps<typeof PanelResizeHandle> {
    withHandle?: boolean;
}

export function ResizableHandle({ withHandle, className, ...props }: ResizableHandleProps) {
    return (
        <PanelResizeHandle
            className={cn(
                "relative flex-shrink-0 w-1 bg-[#1f1f1f] transition-colors duration-150",
                "hover:bg-[#eb5a3f] focus-visible:outline-none focus-visible:bg-[#eb5a3f]/60",
                "data-[panel-group-direction=vertical]:h-1 data-[panel-group-direction=vertical]:w-full",
                "cursor-col-resize data-[panel-group-direction=vertical]:cursor-row-resize",
                className,
            )}
            {...props}
        >
            {withHandle && (
                <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-[#3a3a3a] data-[panel-group-direction=vertical]:h-1 data-[panel-group-direction=vertical]:w-5" />
            )}
        </PanelResizeHandle>
    );
}
