import { formatBytes } from "@pdfly/wasm";
import { renderPdfPagesToJpg, type PdfPageJpg, type RenderPdfPagesToJpgResult } from "@pdfly/wasm/render";
import { RiAddLine } from "@remixicon/react";
import { useId, useRef, useState } from "react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { BeforeAfterView } from "@/components/viewer/BeforeAfterView";
import { EmptyState } from "@/components/emptyState/EmptyState";
import { Button } from "@/components/ui/shadcn/Button";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { SidebarContent } from "@/components/sidebar/SidebarContent";
import { SidebarField } from "@/components/sidebar/SidebarField";
import { SidebarHeader } from "@/components/sidebar/SidebarHeader";
import { SidebarInput, SidebarRange } from "@/components/sidebar/SidebarControls";
import { SidebarSection } from "@/components/sidebar/SidebarSection";
import { EmptyPdfToJpg } from "@/components/pdf/emptyState/EmptyPdfToJpg";
import { PdfPreview } from "@/components/pdf/PdfPreview";
import { ResultTray } from "@/components/pdf/ResultTray";
import { PDF_WASM_SIDE_EFFECT_DEBOUNCE_MS } from "@/constants/pdfToolDebounce";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { useAsyncToolJob } from "@/hooks/pdf/useAsyncToolJob";
import { useObjectUrls } from "@/hooks/pdf/useObjectUrls";
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
} from "@/utils/pdf/pdfToolUtils";

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
            errorMessage: "Failed to convert PDF to JPG.",
            successStatus: (nextResult) => ({
                tone: nextResult.convertedPageCount > 0 ? "success" : "info",
                message:
                    nextResult.convertedPageCount === 0
                        ? "No pages were converted."
                        : `Converted ${nextResult.convertedPageCount} ${nextResult.convertedPageCount === 1 ? "page" : "pages"}.`,
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
            setStatus({ tone: "error", message: "Please select a PDF file." });
            return;
        }

        reset();
        debouncedProcessFile.cancel();
        setFile(nextFile);
        void processFile(nextFile);
    };

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
            setStatus({ tone: "error", message: error instanceof Error ? error.message : "Could not create ZIP." });
        }
    };

    const sidebar = (
        <Sidebar>
            <SidebarSection>
                <SidebarHeader>Conversion</SidebarHeader>
                <SidebarContent>
                    <SidebarField label="Quality">
                        <SidebarRange
                            max={100}
                            min={10}
                            value={settings.qualityPercent}
                            valueLabel={`${settings.qualityPercent}%`}
                            onValueChange={(qualityPercent) => updateConversionSettings({ qualityPercent })}
                        />
                    </SidebarField>
                    <SidebarField label="Scale">
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

            <SidebarSection>
                <SidebarHeader>Export Settings</SidebarHeader>
                <SidebarContent>
                    <SidebarField label="Pattern">
                        <SidebarInput value={settings.outputPattern} onChange={(event) => updateExportSettings({ outputPattern: event.currentTarget.value })} />
                    </SidebarField>
                    <SidebarField label="Archive">
                        <SidebarInput value={settings.archiveName} onChange={(event) => updateExportSettings({ archiveName: event.currentTarget.value })} />
                    </SidebarField>
                </SidebarContent>
            </SidebarSection>
        </Sidebar>
    );

    const pagesOutput =
        pages.length > 0 ? (
            <div className="h-full w-full overflow-y-auto p-3 pb-24">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                    {pages.map((page, index) => (
                        <div key={page.pageIndex} className="flex flex-col gap-1.5 [content-visibility:auto] [contain-intrinsic-size:230px]">
                            <div className="aspect-3/4 overflow-hidden rounded-md border border-app-border bg-app-bg">
                                {pageUrls[index] ? <img alt={`Converted JPG page ${page.pageIndex + 1}`} className="h-full w-full object-contain" src={pageUrls[index]} /> : null}
                            </div>
                            <span className="truncate text-center text-[10px] text-neutral-500">
                                Page {page.pageIndex + 1} · {page.width}x{page.height}
                            </span>
                            <Button className="h-6 text-[10px]" size="sm" variant="secondary" type="button" onClick={() => downloadPage(page)}>
                                Download
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
                    ...(pages.length > 0 ? [{ label: "Pages", value: pages.length, tone: "accent" as const }] : []),
                    ...(elapsedMs !== null ? [{ label: "Time", value: formatDuration(elapsedMs) }] : []),
                    ...(pages.length > 0 && elapsedMs !== null ? [{ label: "Throughput", value: formatThroughput(file.size, elapsedMs) }] : []),
                ]}
                primaryAction={pages.length > 0 ? { label: "Download ZIP", onClick: handleDownloadAll } : undefined}
                secondaryActions={[{ label: "Replace", onClick: () => inputRef.current?.click() }]}
                status={isWorking ? { tone: "info", message: "Converting PDF to JPG..." } : status}
            />
        </div>
    ) : (
        <EmptyState
            badgeIcon={<RiAddLine className="size-5" />}
            description="Each page is converted to a JPG image."
            fileInputId={fileInputId}
            onFiles={handleFiles}
            title="Drop a PDF to convert"
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
            <ToolLayout onFiles={handleFiles} sidebar={sidebar} title="PDF to JPG">
                {centerContent}
            </ToolLayout>
        </>
    );
}
