import { formatBytes, mergePdfs, splitPages } from "@pdfly/wasm";
import { RiAddLine, RiArrowDownLine, RiArrowUpLine, RiDragMove2Line } from "@remixicon/react";
import { useEffect, useId, useRef, useState } from "react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { BeforeAfterView } from "@/components/viewer/BeforeAfterView";
import { EmptyState } from "@/components/emptyState/EmptyState";
import { Button } from "@/components/ui/shadcn/Button";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { SidebarContent } from "@/components/sidebar/SidebarContent";
import { SidebarField } from "@/components/sidebar/SidebarField";
import { SidebarHeader } from "@/components/sidebar/SidebarHeader";
import { SidebarInput } from "@/components/sidebar/SidebarControls";
import { SidebarSection } from "@/components/sidebar/SidebarSection";
import { EmptyOrganize } from "@/components/pdf/emptyState/EmptyOrganize";
import { PdfPageThumbnail } from "@/components/pdf/PdfPageThumbnail";
import { PdfPreview } from "@/components/pdf/PdfPreview";
import { ResultTray } from "@/components/pdf/ResultTray";
import { useAsyncToolJob } from "@/hooks/pdf/useAsyncToolJob";
import { cn } from "@/lib/utils";
import { downloadPdf, ensurePdfExtension, findFirstPdfFile, formatDuration, formatThroughput, pdfBaseName } from "@/utils/pdf/pdfToolUtils";

interface SplitJobResult {
    pages: Uint8Array[];
    pageCount: number;
}

export function OrganizeTool() {
    const fileInputId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [pages, setPages] = useState<Uint8Array[]>([]);
    const [pageOrder, setPageOrder] = useState<number[]>([]);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [outputName, setOutputName] = useState("organized.pdf");

    const { result: splitResult, status: splitStatus, isWorking: isSplitting, reset: resetSplit, runJob: runSplitJob } = useAsyncToolJob<SplitJobResult>();

    const {
        result: reorganizedData,
        elapsedMs,
        status: reorganizeStatus,
        isWorking: isReorganizing,
        reset: resetReorganize,
        runJob: runReorganizeJob,
    } = useAsyncToolJob<Uint8Array>();

    useEffect(() => {
        if (splitResult) {
            setPages(splitResult.pages);
            setPageOrder(splitResult.pages.map((_, i) => i));
        }
    }, [splitResult]);

    const processFile = async (nextFile: File) => {
        await runSplitJob({
            execute: async () => {
                const buffer = await nextFile.arrayBuffer();
                return splitPages(buffer);
            },
            errorMessage: "Failed to load PDF.",
            successStatus: (result) => ({
                tone: "success",
                message: `Loaded ${result.pageCount} ${result.pageCount === 1 ? "page" : "pages"}.`,
            }),
        });
    };

    const handleFiles = (files: File[]) => {
        const nextFile = findFirstPdfFile(files);
        if (!nextFile) {
            return;
        }
        resetSplit();
        resetReorganize();
        setFile(nextFile);
        setPages([]);
        setPageOrder([]);
        setOutputName(`${pdfBaseName(nextFile)}_organized.pdf`);
        void processFile(nextFile);
    };

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex !== null && draggedIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDrop = (dropIndex: number) => {
        if (draggedIndex === null || draggedIndex === dropIndex) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            return;
        }
        const newOrder = [...pageOrder];
        const [item] = newOrder.splice(draggedIndex, 1);
        newOrder.splice(dropIndex, 0, item as number);
        setPageOrder(newOrder);
        resetReorganize();
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleMove = (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= pageOrder.length) return;
        const newOrder = [...pageOrder];
        const [item] = newOrder.splice(index, 1);
        newOrder.splice(target, 0, item as number);
        setPageOrder(newOrder);
        resetReorganize();
    };

    const handleApply = async () => {
        if (pages.length === 0 || pageOrder.length === 0) return;
        await runReorganizeJob({
            execute: async () => {
                const reorderedPages = pageOrder.map((i) => pages[i] as Uint8Array);
                const result = await mergePdfs(reorderedPages);
                return result.data;
            },
            errorMessage: "Failed to reorganize PDF.",
            successStatus: () => ({ tone: "success", message: "PDF reorganized successfully." }),
        });
    };

    const normalizedOutputName = ensurePdfExtension(outputName);
    const isOrderChanged = pageOrder.length > 0 && !pageOrder.every((v, i) => v === i);
    const activeStatus = reorganizeStatus ?? splitStatus;

    const thumbnailGrid =
        pages.length > 0 ? (
            <div className="h-full w-full overflow-y-auto p-3 pb-24">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                    {pageOrder.map((originalIndex, currentIndex) => (
                        <div
                            key={`${originalIndex}-${currentIndex}`}
                            draggable
                            className={cn(
                                "group/card flex flex-col gap-1.5 cursor-grab active:cursor-grabbing transition-opacity [content-visibility:auto] [contain-intrinsic-size:240px]",
                                draggedIndex === currentIndex && "opacity-30",
                                dragOverIndex === currentIndex && draggedIndex !== currentIndex && "outline outline-2 outline-offset-2 outline-brand rounded-md",
                            )}
                            onDragStart={() => handleDragStart(currentIndex)}
                            onDragOver={(e) => handleDragOver(e, currentIndex)}
                            onDrop={() => handleDrop(currentIndex)}
                            onDragEnd={handleDragEnd}
                        >
                            <div className="relative aspect-3/4 overflow-hidden rounded-md border border-app-border bg-app-bg">
                                <PdfPageThumbnail data={pages[originalIndex] as Uint8Array} />
                                <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 transition-opacity group-hover/card:opacity-100">
                                    <button
                                        aria-label={`Move page ${currentIndex + 1} up`}
                                        className="flex h-5 w-5 items-center justify-center rounded bg-black/60 text-neutral-300 hover:bg-black/80 hover:text-white disabled:opacity-30"
                                        disabled={currentIndex === 0}
                                        type="button"
                                        onClick={() => handleMove(currentIndex, -1)}
                                    >
                                        <RiArrowUpLine className="size-3" />
                                    </button>
                                    <button
                                        aria-label={`Move page ${currentIndex + 1} down`}
                                        className="flex h-5 w-5 items-center justify-center rounded bg-black/60 text-neutral-300 hover:bg-black/80 hover:text-white disabled:opacity-30"
                                        disabled={currentIndex === pageOrder.length - 1}
                                        type="button"
                                        onClick={() => handleMove(currentIndex, 1)}
                                    >
                                        <RiArrowDownLine className="size-3" />
                                    </button>
                                </div>
                                <div className="pointer-events-none absolute bottom-1 left-1 flex h-5 w-5 items-center justify-center rounded bg-black/50">
                                    <RiDragMove2Line className="size-3 text-neutral-400" />
                                </div>
                            </div>
                            <span className="truncate text-center text-[10px] text-neutral-500">
                                Page {currentIndex + 1}
                                {originalIndex !== currentIndex && <span className="ml-1 text-neutral-700">(was {originalIndex + 1})</span>}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        ) : null;

    const sidebar = (
        <Sidebar>
            <SidebarSection>
                <SidebarHeader>Output Settings</SidebarHeader>
                <SidebarContent>
                    <SidebarField label="Filename">
                        <SidebarInput value={outputName} onChange={(event) => setOutputName(event.currentTarget.value)} />
                    </SidebarField>
                </SidebarContent>
            </SidebarSection>
        </Sidebar>
    );

    const centerContent = file ? (
        <div className="relative h-full w-full">
            <BeforeAfterView
                after={reorganizedData ? <PdfPreview data={reorganizedData} /> : undefined}
                before={thumbnailGrid ?? <PdfPreview file={file} />}
                isProcessing={isSplitting || isReorganizing}
            />
            <ResultTray
                fileName={file.name}
                fileSize={formatBytes(file.size)}
                metrics={[
                    ...(pages.length > 0 ? [{ label: "Pages", value: pages.length, tone: "accent" as const }] : []),
                    ...(reorganizedData && elapsedMs !== null ? [{ label: "Time", value: formatDuration(elapsedMs) }] : []),
                    ...(reorganizedData && elapsedMs !== null ? [{ label: "Throughput", value: formatThroughput(file.size, elapsedMs) }] : []),
                ]}
                primaryAction={
                    reorganizedData
                        ? { label: "Download PDF", onClick: () => downloadPdf(reorganizedData, normalizedOutputName) }
                        : pages.length > 0
                          ? {
                                label: isOrderChanged ? "Apply Order" : "Apply (no changes)",
                                onClick: handleApply,
                                disabled: isReorganizing,
                            }
                          : undefined
                }
                secondaryActions={[
                    ...(reorganizedData ? [{ label: "Re-apply", onClick: handleApply, disabled: isReorganizing }] : []),
                    { label: file ? "Replace" : "Add PDF", onClick: () => inputRef.current?.click() },
                ]}
                status={isReorganizing ? { tone: "info", message: "Reorganizing pages..." } : isSplitting ? { tone: "info", message: "Loading pages..." } : activeStatus}
            />
        </div>
    ) : (
        <EmptyState
            badgeIcon={<RiAddLine className="size-5" />}
            description="Drag and drop pages to reorder them."
            fileInputId={fileInputId}
            onFiles={handleFiles}
            title="Drop a PDF to organize"
            visual={<EmptyOrganize />}
        />
    );

    return (
        <>
            <input
                id={fileInputId}
                ref={inputRef}
                hidden
                accept="application/pdf,.pdf"
                type="file"
                onChange={(event) => {
                    handleFiles(Array.from(event.currentTarget.files ?? []));
                    event.currentTarget.value = "";
                }}
            />
            <ToolLayout onFiles={handleFiles} sidebar={sidebar} title="Organize Pages">
                {centerContent}
            </ToolLayout>
        </>
    );
}
