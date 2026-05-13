import { formatBytes, organizePdf, splitPdf } from "@pdfly/wasm";
import { RiAddLine } from "@remixicon/react";
import { type DragEvent, useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { BeforeAfterView } from "@/components/viewer/BeforeAfterView";
import { EmptyState } from "@/components/emptyState/EmptyState";
import { Sidebar, SidebarContent, SidebarField, SidebarHeader, SidebarInput, SidebarSection } from "@/components/sidebar";
import { EmptyOrganize } from "@/components/pdf/emptyState/EmptyOrganize";
import { PdfPreview } from "@/components/pdf/PdfPreview";
import { ResultTray } from "@/components/pdf/ResultTray";
import { useAsyncToolJob } from "@/hooks/useAsyncToolJob";
import { downloadPdf, ensurePdfExtension, findFirstPdfFile, formatDuration, formatThroughput, pdfBaseName } from "@/utils/pdfToolUtils.utils";
import { OrganizeThumbnailGrid } from "./OrganizeThumbnailGrid";

interface SplitJobResult {
    pages: Uint8Array[];
    pageCount: number;
}

export function OrganizeTool() {
    const { t } = useTranslation();
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
                return splitPdf(buffer);
            },
            errorMessage: t("organize.status.failedLoad"),
            successStatus: (result) => ({
                tone: "success",
                message: t("organize.status.loaded", { count: result.pageCount }),
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

    const handleDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        if (draggedIndex === null) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const insertBefore = e.clientY < rect.top + rect.height / 2 ? index : index + 1;
        setDragOverIndex(insertBefore);
    };

    const handleDrop = () => {
        if (draggedIndex === null || dragOverIndex === null) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            return;
        }
        const newOrder = [...pageOrder];
        const [item] = newOrder.splice(draggedIndex, 1);
        const insertAt = draggedIndex < dragOverIndex ? dragOverIndex - 1 : dragOverIndex;
        newOrder.splice(insertAt, 0, item as number);
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
        if (!file || pages.length === 0 || pageOrder.length === 0) return;
        await runReorganizeJob({
            execute: async () => {
                const buffer = await file.arrayBuffer();
                const result = await organizePdf(buffer, { pages: pageOrder });
                return result.data;
            },
            errorMessage: t("organize.status.failedReorganize"),
            successStatus: () => ({ tone: "success", message: t("organize.status.reorganized") }),
        });
    };

    const normalizedOutputName = ensurePdfExtension(outputName);
    const isOrderChanged = pageOrder.length > 0 && !pageOrder.every((v, i) => v === i);
    const activeStatus = reorganizeStatus ?? splitStatus;

    // dragOverIndex: insert-before slot in 0..n, null when there is no active drop target
    // no-op when the slot would not move the dragged item (dragOverIndex is draggedIndex or draggedIndex + 1)
    const isNoOp = draggedIndex !== null && dragOverIndex !== null && (dragOverIndex === draggedIndex || dragOverIndex === draggedIndex + 1);
    const showDropIndicator = draggedIndex !== null && dragOverIndex !== null && !isNoOp;

    const thumbnailGrid =
        pages.length > 0 ? (
            <OrganizeThumbnailGrid
                draggedIndex={draggedIndex}
                dragOverIndex={dragOverIndex}
                pageOrder={pageOrder}
                pages={pages}
                showDropIndicator={showDropIndicator}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                onMove={handleMove}
            />
        ) : null;

    const resultMetrics = [
        ...(pages.length > 0 ? [{ label: t("common.metrics.pages"), value: pages.length, tone: "accent" as const }] : []),
        ...(reorganizedData && elapsedMs !== null ? [{ label: t("common.metrics.time"), value: formatDuration(elapsedMs) }] : []),
        ...(file && reorganizedData && elapsedMs !== null ? [{ label: t("common.metrics.throughput"), value: formatThroughput(file.size, elapsedMs) }] : []),
    ];

    const resultPrimaryAction = reorganizedData
        ? { label: t("common.downloadPdf"), onClick: () => downloadPdf(reorganizedData, normalizedOutputName) }
        : pages.length > 0
          ? {
                label: isOrderChanged ? t("organize.actions.applyOrder") : t("organize.actions.applyNoChanges"),
                onClick: handleApply,
                disabled: isReorganizing,
            }
          : undefined;

    const resultSecondaryActions = [
        ...(reorganizedData ? [{ label: t("organize.actions.reApply"), onClick: handleApply, disabled: isReorganizing }] : []),
        { label: file ? t("common.replace") : t("organize.actions.addPdf"), onClick: () => inputRef.current?.click() },
    ];

    const resultTrayStatus = isReorganizing
        ? { tone: "info" as const, message: t("organize.status.reorganizing") }
        : isSplitting
          ? { tone: "info" as const, message: t("organize.status.loading") }
          : activeStatus;

    const sidebar = (
        <Sidebar>
            <SidebarSection>
                <SidebarHeader>{t("common.sidebar.outputSettings")}</SidebarHeader>
                <SidebarContent>
                    <SidebarField label={t("common.sidebar.filename")}>
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
                metrics={resultMetrics}
                primaryAction={resultPrimaryAction}
                secondaryActions={resultSecondaryActions}
                status={resultTrayStatus}
            />
        </div>
    ) : (
        <EmptyState
            badgeIcon={<RiAddLine className="size-5" />}
            description={t("organize.emptyDescription")}
            fileInputId={fileInputId}
            onFiles={handleFiles}
            title={t("organize.emptyTitle")}
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
            <ToolLayout onFiles={handleFiles} sidebar={sidebar} title={t("organize.toolTitle")}>
                {centerContent}
            </ToolLayout>
        </>
    );
}
