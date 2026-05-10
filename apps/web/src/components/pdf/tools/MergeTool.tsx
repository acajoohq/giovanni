import { formatBytes, mergePdfs } from "@pdfly/wasm";
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
import { PdfFilesList } from "@/components/pdf/PdfFilesList";
import { PdfPreview } from "@/components/pdf/PdfPreview";
import { ResultTray } from "@/components/pdf/ResultTray";
import { EmptyMerge } from "@/components/pdf/emptyState/EmptyMerge";
import { useAsyncToolJob } from "@/hooks/useAsyncToolJob";
import { downloadPdf, ensurePdfExtension, filterPdfFiles } from "@/utils/pdfToolUtils.utils";

export function MergeTool() {
    const { t } = useTranslation();
    const fileInputId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [outputName, setOutputName] = useState("merged.pdf");
    const { result: mergedData, status, isWorking, setStatus, reset, runJob } = useAsyncToolJob<Uint8Array>();

    const totalInputBytes = files.reduce((sum, file) => sum + file.size, 0);

    const processFiles = async (nextFiles: File[]) => {
        if (nextFiles.length < 2) {
            reset();
            return;
        }

        await runJob({
            execute: async () => {
                const buffers = await Promise.all(nextFiles.map((file) => file.arrayBuffer()));
                const result = await mergePdfs(buffers);

                return result.data;
            },
            errorMessage: t("merge.status.failed"),
            successStatus: () => ({ tone: "success", message: t("merge.status.merged", { count: nextFiles.length }) }),
        });
    };

    const updateFiles = (nextFiles: File[]) => {
        setFiles(nextFiles);
        void processFiles(nextFiles);
    };

    const handleFiles = (nextFiles: File[]) => {
        const pdfs = filterPdfFiles(nextFiles);

        if (pdfs.length === 0) {
            setStatus({ tone: "error", message: t("merge.status.pleaseSelectPdf") });
            return;
        }

        updateFiles([...files, ...pdfs]);
    };

    const handleRemove = (index: number) => {
        updateFiles(files.filter((_, currentIndex) => currentIndex !== index));
    };

    const handleMove = (index: number, direction: -1 | 1) => {
        const target = index + direction;

        if (target < 0 || target >= files.length) {
            return;
        }

        const nextFiles = [...files];
        const [file] = nextFiles.splice(index, 1);

        if (file) {
            nextFiles.splice(target, 0, file);
        }

        updateFiles(nextFiles);
    };

    const handleDownload = (data: Uint8Array, fileName: string) => {
        try {
            downloadPdf(data, fileName);
        } catch (error) {
            console.error("Failed to download merged PDF", error);
            setStatus({ tone: "error", message: error instanceof Error ? error.message : t("common.couldNotDownload") });
        }
    };

    const normalizedOutputName = ensurePdfExtension(outputName);

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

    const beforeContent =
        files.length > 0 ? (
            <div className="flex h-full flex-col overflow-hidden">
                <div className="flex shrink-0 items-center justify-between border-b border-app-border-subtle px-4 py-2">
                    <span className="text-[11px] font-medium text-muted-foreground">{t("merge.fileCount", { count: files.length })}</span>
                    <Button size="sm" variant="secondary" type="button" onClick={() => inputRef.current?.click()}>
                        {t("merge.actions.addPdfs")}
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 pb-24">
                    <PdfFilesList files={files} onMove={handleMove} onRemove={handleRemove} />
                </div>
            </div>
        ) : null;

    const afterContent =
        files.length < 2 ? (
            <div className="flex h-full items-center justify-center">
                <span className="text-[12px] text-app-text-subtle">{t("merge.minPdfsHint")}</span>
            </div>
        ) : mergedData ? (
            <PdfPreview data={mergedData} />
        ) : undefined;

    const centerContent =
        files.length > 0 ? (
            <div className="relative h-full w-full">
                <BeforeAfterView after={afterContent} before={beforeContent} isProcessing={isWorking && files.length >= 2} />
                <ResultTray
                    fileName={t("merge.pdfCount", { count: files.length })}
                    fileSize={formatBytes(totalInputBytes)}
                    metrics={[
                        { label: t("merge.metrics.files"), value: files.length, tone: files.length > 1 ? "accent" : "neutral" },
                        ...(mergedData ? [{ label: t("common.metrics.output"), value: formatBytes(mergedData.byteLength) }] : []),
                    ]}
                    primaryAction={mergedData ? { label: t("common.downloadPdf"), onClick: () => handleDownload(mergedData, normalizedOutputName) } : undefined}
                    secondaryActions={[{ label: t("merge.actions.addPdfs"), onClick: () => inputRef.current?.click() }]}
                    status={isWorking ? { tone: "info", message: t("merge.status.merging") } : status}
                />
            </div>
        ) : (
            <EmptyState
                badgeIcon={<RiAddLine className="size-5" />}
                description={t("merge.emptyDescription")}
                fileInputId={fileInputId}
                onFiles={handleFiles}
                title={t("merge.emptyTitle")}
                visual={<EmptyMerge />}
            />
        );

    return (
        <>
            <input
                id={fileInputId}
                ref={inputRef}
                hidden
                multiple
                accept="application/pdf,.pdf"
                type="file"
                onChange={(event) => {
                    handleFiles(Array.from(event.currentTarget.files ?? []));
                    event.currentTarget.value = "";
                }}
            />
            <ToolLayout isMultiple onFiles={handleFiles} sidebar={sidebar} title={t("merge.toolTitle")}>
                {centerContent}
            </ToolLayout>
        </>
    );
}
