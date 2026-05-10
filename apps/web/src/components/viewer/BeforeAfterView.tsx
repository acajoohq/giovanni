import { useState, type ReactNode } from "react";
import { RiLayoutColumnLine, RiLayoutRowLine } from "@remixicon/react";
import { useTranslation } from "react-i18next";
import { ProcessingPlaceholder } from "@/components/viewer/ProcessingPlaceholder";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/shadcn/Resizable";

type Direction = "horizontal" | "vertical";

interface BeforeAfterViewProps {
    before: ReactNode;
    after?: ReactNode;
    isProcessing?: boolean;
}

export function BeforeAfterView({ before, after, isProcessing }: BeforeAfterViewProps) {
    const { t } = useTranslation();
    const [direction, setDirection] = useState<Direction>("horizontal");

    return (
        <div className="relative h-full w-full">
            <button
                className="absolute right-2 top-2 z-20 flex h-6 items-center gap-1 rounded-md border border-app-control-hover bg-app-surface-raised px-2 text-[10px] font-medium text-neutral-600 transition-colors hover:border-app-border-strong hover:text-neutral-400"
                type="button"
                onClick={() => setDirection((d) => (d === "horizontal" ? "vertical" : "horizontal"))}
            >
                {direction === "horizontal" ? (
                    <>
                        <RiLayoutRowLine className="size-3" /> {t("common.viewer.vertical")}
                    </>
                ) : (
                    <>
                        <RiLayoutColumnLine className="size-3" /> {t("common.viewer.horizontal")}
                    </>
                )}
            </button>

            <ResizablePanelGroup key={direction} className="h-full w-full" direction={direction}>
                <ResizablePanel defaultSize={50} minSize={20}>
                    <div className="relative h-full overflow-hidden">
                        <SectionBadge>{t("common.viewer.input")}</SectionBadge>
                        {before}
                    </div>
                </ResizablePanel>

                <ResizableHandle />

                <ResizablePanel defaultSize={50} minSize={20}>
                    <div className="relative h-full overflow-hidden">
                        <SectionBadge>{t("common.viewer.output")}</SectionBadge>
                        {isProcessing ? <ProcessingPlaceholder /> : (after ?? <OutputPlaceholder />)}
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}

function SectionBadge({ children }: { children: ReactNode }) {
    return (
        <div className="pointer-events-none absolute left-2 top-2 z-10 rounded-full border border-app-control-hover bg-app-surface-raised px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-neutral-700">
            {children}
        </div>
    );
}

function OutputPlaceholder() {
    const { t } = useTranslation();
    return (
        <div className="flex h-full w-full items-center justify-center">
            <span className="text-[12px] text-neutral-700">{t("common.viewer.outputPlaceholder")}</span>
        </div>
    );
}
