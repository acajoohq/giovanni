import { formatBytes } from "@pdfly/wasm";
import { renderPdfPagesToJpg, type PdfPageJpg, type RenderPdfPagesToJpgResult } from "@pdfly/pdf-render";
import { RiAddLine } from "@remixicon/react";
import { useId, useRef, useState } from "react";
import { usePendingFileHandler } from "@/hooks/usePendingFileHandler";
import { useTranslation } from "react-i18next";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { BeforeAfterView } from "@/components/viewer/BeforeAfterView";
import { EmptyState } from "@/components/emptyState/EmptyState";
import { Button } from "@/components/ui/shadcn/Button";
import { Sidebar, SidebarCollapsibleSection, SidebarContent, SidebarField, SidebarHeader, SidebarInput, SidebarRange, SidebarSection } from "@/components/sidebar";
import { EmptyPdfToJpg } from "@/components/pdf/emptyState/EmptyPdfToJpg";
import { PdfPreview } from "@/components/pdf/PdfPreview";
import { ResultTray } from "@/components/pdf/ResultTray";
import { PDF_WASM_SIDE_EFFECT_DEBOUNCE_MS } from "@/constants/pdfToolDebounce.constants";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { useAsyncToolJob } from "@/hooks/useAsyncToolJob";
import { useObjectUrls } from "@/hooks/useObjectUrls";
import {
    buildJpgPageEntries,
    downloadBlob,
    downloadZip,
    findFirstPdfFile,
    formatDuration,
    formatThroughput,
    makeArchiveName,
    makePageJpgName,
    pdfBaseName,
} from "@/utils/pdfTool.utils";

interface RenderPagesToJpgSettings {
    qualityPercent: number;
    scale: number;
    outputPattern: string;
    archiveName: string;
}

function getPageBlob(page: PdfPageJpg) {
    return page.blob;
}

export function PdfToJpgTool() {
    const { t } = useTranslation();
    const fileInputId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [settings, setSettings] = useState<RenderPagesToJpgSettings>({
        qualityPercent: 92,
        scale: 2,
        outputPattern: "{basename}_page_{page}",
        archiveName: "{basename}_jpg.zip",
    });
    const { result, elapsedMs, status, isWorking, setStatus, reset, runJob } = useAsyncToolJob<RenderPdfPagesToJpgResult>();
    const pages = result?.pages ?? [];
    const pageUrls = useObjectUrls(pages, getPageBlob);

    const processFile = async (nextFile: File, nextSettings: RenderPagesToJpgSettings = settings) => {
        await runJob({
            execute: async () => {
                const buffer = await nextFile.arrayBuffer();

                return renderPdfPagesToJpg(buffer, {
                    quality: nextSettings.qualityPercent / 100,
                    scale: nextSettings.scale,
                });
            },
            errorMessage: t("pdfToJpg.status.failed"),
            successStatus: (nextResult) => ({
                tone: nextResult.convertedPageCount > 0 ? "success" : "info",
                message: nextResult.convertedPageCount === 0 ? t("pdfToJpg.status.noPages") : t("pdfToJpg.status.converted", { count: nextResult.convertedPageCount }),
            }),
        });
    };

    const debouncedProcessFile = useDebouncedCallback((nextFile: File, nextSettings: RenderPagesToJpgSettings) => {
        void processFile(nextFile, nextSettings);
    }, PDF_WASM_SIDE_EFFECT_DEBOUNCE_MS);

    const scheduleCurrentFileProcessing = (nextSettings: RenderPagesToJpgSettings) => {
        if (!file) {
            debouncedProcessFile.cancel();
            return;
        }

        debouncedProcessFile(file, nextSettings);
    };

    const updateConversionSettings = (patch: Partial<Pick<RenderPagesToJpgSettings, "qualityPercent" | "scale">>) => {
        const nextSettings = { ...settings, ...patch };
        setSettings(nextSettings);
        scheduleCurrentFileProcessing(nextSettings);
    };

    const updateExportSettings = (patch: Partial<Pick<RenderPagesToJpgSettings, "outputPattern" | "archiveName">>) => {
        setSettings((currentSettings) => ({ ...currentSettings, ...patch }));
    };

    const handleFiles = (files: File[]) => {
        const nextFile = findFirstPdfFile(files);

        if (!nextFile) {
            setStatus({ tone: "error", message: t("common.selectPdf") });
            return;
        }

        reset();
        debouncedProcessFile.cancel();
        setFile(nextFile);
        void processFile(nextFile);
    };

    usePendingFileHandler(handleFiles);

    const downloadPage = (page: PdfPageJpg) => {
        downloadBlob(page.blob, makePageJpgName(settings.outputPattern, pdfBaseName(file), page.pageIndex));
    };

    const handleDownloadAll = async () => {
        if (pages.length === 0 || !file) {
            return;
        }

        try {
            await downloadZip(await buildJpgPageEntries(pages, settings.outputPattern, pdfBaseName(file)), makeArchiveName(settings.archiveName, pdfBaseName(file)));
        } catch (error) {
            setStatus({ tone: "error", message: error instanceof Error ? error.message : t("common.couldNotCreateZip") });
        }
    };

    const sidebar = (
        <Sidebar>
            <SidebarSection>
                <SidebarHeader>{t("pdfToJpg.sidebar.conversion")}</SidebarHeader>
                <SidebarContent>
                    <SidebarField label={t("pdfToJpg.sidebar.quality")}>
                        <SidebarRange
                            max={100}
                            min={10}
                            value={settings.qualityPercent}
                            valueLabel={`${settings.qualityPercent}%`}
                            onValueChange={(qualityPercent) => updateConversionSettings({ qualityPercent })}
                        />
                    </SidebarField>
                    <SidebarField label={t("pdfToJpg.sidebar.scale")}>
                        <SidebarRange
                            max={4}
                            min={0.5}
                            step={0.5}
                            value={settings.scale}
                            valueLabel={`${settings.scale}x`}
                            onValueChange={(scale) => updateConversionSettings({ scale })}
                        />
                    </SidebarField>
                </SidebarContent>
            </SidebarSection>

            <SidebarCollapsibleSection title={t("pdfToJpg.sidebar.exportSettings")} storageKey="pdf-to-jpg-export-settings">
                <SidebarContent>
                    <SidebarField label={t("pdfToJpg.sidebar.pattern")}>
                        <SidebarInput value={settings.outputPattern} onChange={(event) => updateExportSettings({ outputPattern: event.currentTarget.value })} />
                    </SidebarField>
                    <SidebarField label={t("pdfToJpg.sidebar.archive")}>
                        <SidebarInput value={settings.archiveName} onChange={(event) => updateExportSettings({ archiveName: event.currentTarget.value })} />
                    </SidebarField>
                </SidebarContent>
            </SidebarCollapsibleSection>
        </Sidebar>
    );

    const pagesOutput =
        pages.length > 0 ? (
            <div className="h-full w-full overflow-y-auto p-3 pb-24">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                    {pages.map((page, index) => (
                        <div key={page.pageIndex} className="flex flex-col gap-1.5 [content-visibility:auto] [contain-intrinsic-size:230px]">
                            <div className="aspect-3/4 overflow-hidden rounded-md border border-app-border bg-app-bg">
                                {pageUrls[index] ? (
                                    <img alt={t("pdfToJpg.jpgAlt", { page: page.pageIndex + 1 })} className="h-full w-full object-contain" src={pageUrls[index]} />
                                ) : null}
                            </div>
                            <span className="truncate text-center text-[10px] text-muted-foreground">
                                {t("pdfToJpg.pageLabel", { page: page.pageIndex + 1, width: page.width, height: page.height })}
                            </span>
                            <Button className="h-6 text-[10px]" size="sm" variant="secondary" type="button" onClick={() => downloadPage(page)}>
                                {t("common.download")}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        ) : null;

    const centerContent = file ? (
        <div className="relative h-full w-full">
            <BeforeAfterView after={pagesOutput} before={<PdfPreview file={file} />} isProcessing={isWorking} />
            <ResultTray
                fileName={file.name}
                fileSize={formatBytes(file.size)}
                metrics={[
                    ...(pages.length > 0 ? [{ label: t("common.metrics.pages"), value: pages.length, tone: "accent" as const }] : []),
                    ...(elapsedMs !== null ? [{ label: t("common.metrics.time"), value: formatDuration(elapsedMs) }] : []),
                    ...(pages.length > 0 && elapsedMs !== null ? [{ label: t("common.metrics.throughput"), value: formatThroughput(file.size, elapsedMs) }] : []),
                ]}
                primaryAction={pages.length > 0 ? { label: t("common.downloadZip"), onClick: handleDownloadAll } : undefined}
                secondaryActions={[{ label: t("common.replace"), onClick: () => inputRef.current?.click() }]}
                status={isWorking ? { tone: "info", message: t("pdfToJpg.status.converting") } : status}
            />
        </div>
    ) : (
        <EmptyState
            badgeIcon={<RiAddLine className="size-5" />}
            description={t("pdfToJpg.emptyDescription")}
            fileInputId={fileInputId}
            onFiles={handleFiles}
            title={t("pdfToJpg.emptyTitle")}
            visual={<EmptyPdfToJpg />}
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
            <ToolLayout onFiles={handleFiles} sidebar={sidebar} title={t("pdfToJpg.toolTitle")}>
                {centerContent}
            </ToolLayout>
        </>
    );
}
