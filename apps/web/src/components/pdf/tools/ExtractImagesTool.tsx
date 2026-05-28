import { extractImages, formatBytes, type ExtractedImage, type ExtractImagesResult } from "@pdfly/wasm";
import { RiAddLine } from "@remixicon/react";
import { useId, useRef, useState } from "react";
import { usePendingFileHandler } from "@/hooks/usePendingFileHandler";
import { useTranslation } from "react-i18next";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { BeforeAfterView } from "@/components/viewer/BeforeAfterView";
import { EmptyState } from "@/components/emptyState/EmptyState";
import { Button } from "@/components/ui/shadcn/Button";
import { Sidebar, SidebarCheckbox, SidebarCollapsibleSection, SidebarContent, SidebarField, SidebarHeader, SidebarInput, SidebarSection } from "@/components/sidebar";
import { EmptyExtractImages } from "@/components/pdf/emptyState/EmptyExtractImages";
import { ExtractedImageCard } from "@/components/pdf/ExtractedImageCard";
import { PdfPreview } from "@/components/pdf/PdfPreview";
import { ResultTray } from "@/components/pdf/ResultTray";
import { useAsyncToolJob } from "@/hooks/useAsyncToolJob";
import { useObjectUrls } from "@/hooks/useObjectUrls";
import {
    buildExtractedImageEntries,
    downloadBlob,
    downloadZip,
    findFirstPdfFile,
    imageDownloadName,
    makeArchiveName,
    pdfBaseName,
    summarizeExtractedImages,
} from "@/utils/pdfTool.utils";

const EMPTY_IMAGES: ExtractedImage[] = [];

interface ExtractImagesSettings {
    archiveName: string;
    includeRawStreams: boolean;
}

function getImageBlob(image: ExtractedImage) {
    return image.blob;
}

export function ExtractImagesTool() {
    const { t } = useTranslation();
    const fileInputId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [extractImagesSettings, setExtractImagesSettings] = useState<ExtractImagesSettings>({
        archiveName: "{basename}_images.zip",
        includeRawStreams: false,
    });
    const { result, status, isWorking, setStatus, reset, runJob } = useAsyncToolJob<ExtractImagesResult>();
    const images = result?.images ?? EMPTY_IMAGES;
    const previewUrls = useObjectUrls(images, getImageBlob);

    const { decodedCount, rawCount } = summarizeExtractedImages(images);

    const processFile = async (nextFile: File) => {
        await runJob({
            execute: async () => {
                const buffer = await nextFile.arrayBuffer();

                return extractImages(buffer);
            },
            errorMessage: t("extractImages.status.failed"),
            successStatus: (nextResult) => {
                const { imageCount: nextImageCount, decodedCount: nextDecodedCount, rawCount: nextRawCount } = summarizeExtractedImages(nextResult.images);

                if (nextImageCount === 0) {
                    return { tone: "info", message: t("extractImages.status.noImages") };
                }

                if (nextRawCount > 0) {
                    return {
                        tone: "success",
                        message: t("extractImages.status.extractedWithRaw", { count: nextDecodedCount, raw: nextRawCount }),
                    };
                }

                return {
                    tone: "success",
                    message: t("extractImages.status.extracted", { count: nextDecodedCount }),
                };
            },
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

    usePendingFileHandler(handleFiles);

    const updateExtractImagesSettings = (patch: Partial<ExtractImagesSettings>) => {
        setExtractImagesSettings((currentSettings) => ({ ...currentSettings, ...patch }));
    };

    const downloadImage = (image: ExtractedImage, index: number) => {
        const name = imageDownloadName(pdfBaseName(file), index, image);

        if (image.blob) {
            downloadBlob(image.blob, name);
            return;
        }

        downloadBlob(new Blob([image.bytes as BlobPart], { type: "application/octet-stream" }), name);
    };

    const handleDownloadAll = async () => {
        if (images.length === 0 || !file) {
            return;
        }

        const entries = await buildExtractedImageEntries(images, pdfBaseName(file), { includeRawStreams: extractImagesSettings.includeRawStreams });

        if (Object.keys(entries).length === 0) {
            setStatus({
                tone: "error",
                message: extractImagesSettings.includeRawStreams ? t("extractImages.status.noImagesToBundle") : t("extractImages.status.noBrowserReadyImages"),
            });
            return;
        }

        try {
            await downloadZip(entries, makeArchiveName(extractImagesSettings.archiveName, pdfBaseName(file)));
        } catch (error) {
            setStatus({ tone: "error", message: error instanceof Error ? error.message : t("common.couldNotCreateZip") });
        }
    };

    const sidebar = (
        <Sidebar>
            <SidebarSection>
                <SidebarHeader>{t("extractImages.sidebar.exportSettings")}</SidebarHeader>
                <SidebarContent>
                    <SidebarField label={t("extractImages.sidebar.archive")}>
                        <SidebarInput value={extractImagesSettings.archiveName} onChange={(event) => updateExtractImagesSettings({ archiveName: event.currentTarget.value })} />
                    </SidebarField>
                </SidebarContent>
            </SidebarSection>
            <SidebarCollapsibleSection title="Advanced" storageKey="extract-images-advanced">
                <SidebarContent>
                    <SidebarCheckbox
                        checked={extractImagesSettings.includeRawStreams}
                        label={t("extractImages.sidebar.includeRaw")}
                        onChange={(event) => updateExtractImagesSettings({ includeRawStreams: event.currentTarget.checked })}
                    />
                </SidebarContent>
            </SidebarCollapsibleSection>
        </Sidebar>
    );

    const imagesOutput =
        images.length > 0 ? (
            <div className="h-full w-full overflow-y-auto p-4 pb-24">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                    {images.map((image, index) => (
                        <div key={`${image.objectKey}-${image.xobjectKey}`} className="space-y-2 [content-visibility:auto] [contain-intrinsic-size:210px]">
                            <ExtractedImageCard image={image} index={index} url={previewUrls[index] ?? null} />
                            <Button className="w-full" size="sm" variant="secondary" type="button" onClick={() => downloadImage(image, index)}>
                                {image.blob ? t("common.download") : t("common.downloadRaw")}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        ) : null;

    const centerContent = file ? (
        <div className="relative h-full w-full">
            <BeforeAfterView after={imagesOutput} before={<PdfPreview file={file} />} isProcessing={isWorking} />
            <ResultTray
                fileName={file.name}
                fileSize={formatBytes(file.size)}
                metrics={[
                    ...(images.length > 0 ? [{ label: t("extractImages.metrics.images"), value: images.length, tone: "accent" as const }] : []),
                    ...(images.length > 0 ? [{ label: t("extractImages.metrics.decoded"), value: decodedCount }] : []),
                    ...(rawCount > 0 ? [{ label: t("extractImages.metrics.raw"), value: rawCount }] : []),
                ]}
                primaryAction={
                    file
                        ? {
                              label: t("common.downloadZip"),
                              disabled: images.length === 0 || (!extractImagesSettings.includeRawStreams && decodedCount === 0),
                              onClick: handleDownloadAll,
                          }
                        : undefined
                }
                secondaryActions={[{ label: t("common.replace"), onClick: () => inputRef.current?.click() }]}
                status={isWorking ? { tone: "info", message: t("extractImages.status.extracting") } : status}
            />
        </div>
    ) : (
        <EmptyState
            badgeIcon={<RiAddLine className="size-5" />}
            description={t("extractImages.emptyDescription")}
            fileInputId={fileInputId}
            onFiles={handleFiles}
            title={t("extractImages.emptyTitle")}
            visual={<EmptyExtractImages />}
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
            <ToolLayout onFiles={handleFiles} sidebar={sidebar} title={t("extractImages.toolTitle")}>
                {centerContent}
            </ToolLayout>
        </>
    );
}
