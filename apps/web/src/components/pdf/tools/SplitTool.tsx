import { formatBytes, splitPages } from "@pdfly/wasm";
import { RiAddLine } from "@remixicon/react";
import { useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { SidebarToggle } from "@/components/sidebar/SidebarToggle";
import { SidebarToggleGroup } from "@/components/sidebar/SidebarToggleGroup";
import { EmptySplit } from "@/components/pdf/emptyState/EmptySplit";
import { PdfPageThumbnail } from "@/components/pdf/PdfPageThumbnail";
import { PdfPreview } from "@/components/pdf/PdfPreview";
import { ResultTray } from "@/components/pdf/ResultTray";
import { useAsyncToolJob } from "@/hooks/pdf/useAsyncToolJob";
import {
    buildSplitPageEntries,
    downloadPdf,
    downloadZip,
    findFirstPdfFile,
    formatDuration,
    formatThroughput,
    makeArchiveName,
    makePagePdfName,
    pdfBaseName,
} from "@/utils/pdf/pdfToolUtils";

interface SplitJobResult {
    pages: Uint8Array[];
    pageCount: number;
}

type ZipCompressionMode = "store" | "compress";

interface SplitSettings {
    outputPattern: string;
    archiveName: string;
    zipCompressionMode: ZipCompressionMode;
}

export function SplitTool() {
    const { t } = useTranslation();
    const fileInputId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [splitSettings, setSplitSettings] = useState<SplitSettings>({
        outputPattern: "{basename}_page_{page}",
        archiveName: "{basename}_pages.zip",
        zipCompressionMode: "store",
    });
    const { result, elapsedMs, status, isWorking, setStatus, reset, runJob } = useAsyncToolJob<SplitJobResult>();

    const pages = result?.pages ?? [];

    const processFile = async (nextFile: File) => {
        await runJob({
            execute: async () => {
                const buffer = await nextFile.arrayBuffer();

                return splitPages(buffer);
            },
            errorMessage: t("split.status.failed"),
            successStatus: (nextResult) => ({
                tone: "success",
                message: t("split.status.extracted", { count: nextResult.pageCount }),
            }),
        });
    };

    const handleFiles = (files: File[]) => {
        const nextFile = findFirstPdfFile(files);

        if (!nextFile) {
            setStatus({ tone: "error", message: t("common.selectPdf") });
            return;
        }

        reset();
        setFile(nextFile);
        void processFile(nextFile);
    };

    const updateSplitSettings = (patch: Partial<SplitSettings>) => {
        setSplitSettings((currentSettings) => ({ ...currentSettings, ...patch }));
    };

    const makePageName = (pageIndex: number) => makePagePdfName(splitSettings.outputPattern, pdfBaseName(file), pageIndex);

    const handleDownloadPage = (page: Uint8Array, pageIndex: number) => {
        try {
            downloadPdf(page, makePageName(pageIndex));
        } catch (error) {
            console.error("Failed to download split page", error);
            setStatus({ tone: "error", message: error instanceof Error ? error.message : t("common.couldNotDownload") });
        }
    };

    const handleDownloadAll = async () => {
        if (pages.length === 0 || !file) {
            return;
        }

        try {
            await downloadZip(
                buildSplitPageEntries(pages, splitSettings.outputPattern, pdfBaseName(file)),
                makeArchiveName(splitSettings.archiveName, pdfBaseName(file)),
                splitSettings.zipCompressionMode === "store" ? 0 : 6,
            );
        } catch (error) {
            console.error("Failed to download split ZIP", error);
            setStatus({ tone: "error", message: error instanceof Error ? error.message : t("common.couldNotCreateZip") });
        }
    };

    const sidebar = (
        <Sidebar>
            <SidebarSection>
                <SidebarHeader>{t("split.sidebar.splitSettings")}</SidebarHeader>
                <SidebarContent>
                    <SidebarField label={t("split.sidebar.pattern")}>
                        <SidebarInput value={splitSettings.outputPattern} onChange={(event) => updateSplitSettings({ outputPattern: event.currentTarget.value })} />
                    </SidebarField>
                    <SidebarField label={t("split.sidebar.archive")}>
                        <SidebarInput value={splitSettings.archiveName} onChange={(event) => updateSplitSettings({ archiveName: event.currentTarget.value })} />
                    </SidebarField>
                    <SidebarField label={t("split.sidebar.zip")}>
                        <SidebarToggleGroup>
                            <SidebarToggle isActive={splitSettings.zipCompressionMode === "store"} onClick={() => updateSplitSettings({ zipCompressionMode: "store" })}>
                                {t("split.sidebar.store")}
                            </SidebarToggle>
                            <SidebarToggle isActive={splitSettings.zipCompressionMode === "compress"} onClick={() => updateSplitSettings({ zipCompressionMode: "compress" })}>
                                {t("split.sidebar.compress")}
                            </SidebarToggle>
                        </SidebarToggleGroup>
                    </SidebarField>
                </SidebarContent>
            </SidebarSection>
        </Sidebar>
    );

    const pagesOutput =
        pages.length > 0 && file ? (
            <div className="h-full w-full overflow-y-auto p-3 pb-24">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                    {pages.map((page, index) => (
                        <div key={index} className="flex flex-col gap-1.5 [content-visibility:auto] [contain-intrinsic-size:260px]">
                            <div className="aspect-3/4 overflow-hidden rounded-md border border-app-border bg-app-bg">
                                <PdfPageThumbnail data={page} />
                            </div>
                            <span className="truncate text-center text-[10px] text-neutral-500">{t("split.pageLabel", { page: index + 1 })}</span>
                            <Button className="h-6 text-[10px]" size="sm" variant="secondary" type="button" onClick={() => handleDownloadPage(page, index)}>
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
                status={isWorking ? { tone: "info", message: t("split.status.splitting") } : status}
            />
        </div>
    ) : (
        <EmptyState
            badgeIcon={<RiAddLine className="size-5" />}
            description={t("split.emptyDescription")}
            fileInputId={fileInputId}
            onFiles={handleFiles}
            title={t("split.emptyTitle")}
            visual={<EmptySplit />}
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
            <ToolLayout onFiles={handleFiles} sidebar={sidebar} title={t("split.toolTitle")}>
                {centerContent}
            </ToolLayout>
        </>
    );
}
