import * as React from "react";
import { RiLayoutColumnLine, RiLayoutRowLine } from "@remixicon/react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./shadcn-ui/Resizable";

type Direction = "horizontal" | "vertical";

interface BeforeAfterViewProps {
    before: React.ReactNode;
    after?: React.ReactNode;
    isProcessing?: boolean;
}

export function BeforeAfterView({ before, after, isProcessing }: BeforeAfterViewProps) {
    const [direction, setDirection] = React.useState<Direction>("horizontal");

    return (
        <div className="relative h-full w-full">
            <button
                className="absolute right-2 top-2 z-20 flex h-6 items-center gap-1 rounded-md border border-[#252525] bg-[#141414] px-2 text-[10px] font-medium text-neutral-600 transition-colors hover:border-[#333] hover:text-neutral-400"
                onClick={() => setDirection((d) => (d === "horizontal" ? "vertical" : "horizontal"))}
            >
                {direction === "horizontal" ? (
                    <>
                        <RiLayoutRowLine className="size-3" /> Vertical
                    </>
                ) : (
                    <>
                        <RiLayoutColumnLine className="size-3" /> Horizontal
                    </>
                )}
            </button>

            <ResizablePanelGroup key={direction} className="h-full w-full" direction={direction}>
                <ResizablePanel defaultSize={50} minSize={20}>
                    <div className="relative h-full overflow-hidden">
                        <SectionBadge>Input</SectionBadge>
                        {before}
                    </div>
                </ResizablePanel>

                <ResizableHandle />

                <ResizablePanel defaultSize={50} minSize={20}>
                    <div className="relative h-full overflow-hidden">
                        <SectionBadge>Output</SectionBadge>
                        {isProcessing ? <ProcessingPlaceholder /> : (after ?? <OutputPlaceholder />)}
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}

function SectionBadge({ children }: { children: React.ReactNode }) {
    return (
        <div className="pointer-events-none absolute left-2 top-2 z-10 rounded-full border border-[#252525] bg-[#141414] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-neutral-700">
            {children}
        </div>
    );
}

function ProcessingPlaceholder() {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-neutral-600">
            <div className="size-5 animate-spin rounded-full border-2 border-[#252525] border-t-[#eb5a3f]" />
            <span className="text-[12px]">Processing...</span>
        </div>
    );
}

function OutputPlaceholder() {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <span className="text-[12px] text-neutral-700">Output will appear here</span>
        </div>
    );
}
