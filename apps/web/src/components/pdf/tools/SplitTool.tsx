import { formatBytes, splitPages } from "@pdfly/wasm";
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
            errorMessage: "Failed to split PDF.",
            successStatus: (nextResult) => ({
                tone: "success",
                message: `Extracted ${nextResult.pageCount} ${nextResult.pageCount === 1 ? "page" : "pages"}.`,
            }),
        });
    };

    const handleFiles = (files: File[]) => {
        const nextFile = findFirstPdfFile(files);

        if (!nextFile) {
            setStatus({ tone: "error", message: "Please select a PDF file." });
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
            setStatus({ tone: "error", message: error instanceof Error ? error.message : "Could not create ZIP." });
        }
    };

    const sidebar = (
        <Sidebar>
            <SidebarSection>
                <SidebarHeader>Split Settings</SidebarHeader>
                <SidebarContent>
                    <SidebarField label="Pattern">
                        <SidebarInput value={splitSettings.outputPattern} onChange={(event) => updateSplitSettings({ outputPattern: event.currentTarget.value })} />
                    </SidebarField>
                    <SidebarField label="Archive">
                        <SidebarInput value={splitSettings.archiveName} onChange={(event) => updateSplitSettings({ archiveName: event.currentTarget.value })} />
                    </SidebarField>
                    <SidebarField label="ZIP">
                        <SidebarToggleGroup>
                            <SidebarToggle isActive={splitSettings.zipCompressionMode === "store"} onClick={() => updateSplitSettings({ zipCompressionMode: "store" })}>
                                Store
                            </SidebarToggle>
                            <SidebarToggle isActive={splitSettings.zipCompressionMode === "compress"} onClick={() => updateSplitSettings({ zipCompressionMode: "compress" })}>
                                Compress
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
                            <span className="truncate text-center text-[10px] text-neutral-500">Page {index + 1}</span>
                            <Button className="h-6 text-[10px]" size="sm" variant="secondary" type="button" onClick={() => downloadPdf(page, makePageName(index))}>
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
                status={isWorking ? { tone: "info", message: "Splitting pages..." } : status}
            />
        </div>
    ) : (
        <EmptyState
            badgeIcon={<RiAddLine className="size-5" />}
            description="Each page becomes a downloadable PDF."
            fileInputId={fileInputId}
            onFiles={handleFiles}
            title="Drop a PDF to split"
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
            <ToolLayout onFiles={handleFiles} sidebar={sidebar} title="Split Pages">
                {centerContent}
            </ToolLayout>
        </>
    );
}
