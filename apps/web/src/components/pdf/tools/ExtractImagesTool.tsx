import { extractImages, formatBytes, type ExtractedImage, type ExtractImagesResult } from "@pdfly/wasm";
import { RiAddLine } from "@remixicon/react";
import { useId, useRef, useState } from "react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { BeforeAfterView } from "@/components/viewer/BeforeAfterView";
import { EmptyState } from "@/components/emptyState/EmptyState";
import { Button } from "@/components/ui/shadcn/Button";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { SidebarCheckbox } from "@/components/sidebar/SidebarCheckbox";
import { SidebarContent } from "@/components/sidebar/SidebarContent";
import { SidebarField } from "@/components/sidebar/SidebarField";
import { SidebarHeader } from "@/components/sidebar/SidebarHeader";
import { SidebarInput } from "@/components/sidebar/SidebarControls";
import { SidebarSection } from "@/components/sidebar/SidebarSection";
import { EmptyExtractImages } from "@/components/pdf/emptyState/EmptyExtractImages";
import { ExtractedImageCard } from "@/components/pdf/ExtractedImageCard";
import { PdfPreview } from "@/components/pdf/PdfPreview";
import { ResultTray } from "@/components/pdf/ResultTray";
import { useAsyncToolJob } from "@/hooks/useAsyncToolJob";
import { useObjectUrls } from "@/hooks/useObjectUrls";
import { buildExtractedImageEntries, downloadBlob, downloadZip, findFirstPdfFile, imageDownloadName, makeArchiveName, pdfBaseName } from "@/utils/pdfToolUtils";

const EMPTY_IMAGES: ExtractedImage[] = [];

interface ExtractImagesSettings {
    archiveName: string;
    includeRawStreams: boolean;
}

function getImageBlob(image: ExtractedImage) {
    return image.blob;
}

export function ExtractImagesTool() {
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

    const { decodedCount, rawCount } = (() => {
        let decodedImages = 0;

        for (const image of images) {
            if (image.blob) {
                decodedImages++;
            }
        }

        return { decodedCount: decodedImages, rawCount: images.length - decodedImages };
    })();

    const processFile = async (nextFile: File) => {
        await runJob({
            execute: async () => {
                const buffer = await nextFile.arrayBuffer();

                return extractImages(buffer);
            },
            errorMessage: "Failed to extract images.",
            successStatus: (nextResult) => {
                let nextDecodedCount = 0;
                for (const image of nextResult.images) {
                    if (image.blob) {
                        nextDecodedCount++;
                    }
                }
                const nextRawCount = nextResult.imageCount - nextDecodedCount;

                return {
                    tone: nextResult.imageCount > 0 ? "success" : "info",
                    message:
                        nextResult.imageCount === 0
                            ? "No embedded raster images were found."
                            : `Extracted ${nextDecodedCount} browser-ready ${nextDecodedCount === 1 ? "image" : "images"}${nextRawCount > 0 ? ` and ${nextRawCount} raw streams` : ""}.`,
                };
            },
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
                message: extractImagesSettings.includeRawStreams ? "No images are available to bundle." : "No browser-ready images are available to bundle.",
            });
            return;
        }

        try {
            await downloadZip(entries, makeArchiveName(extractImagesSettings.archiveName, pdfBaseName(file)));
        } catch (error) {
            setStatus({ tone: "error", message: error instanceof Error ? error.message : "Could not create ZIP." });
        }
    };

    const sidebar = (
        <Sidebar>
            <SidebarSection>
                <SidebarHeader>Export Settings</SidebarHeader>
                <SidebarContent>
                    <SidebarField label="Archive">
                        <SidebarInput value={extractImagesSettings.archiveName} onChange={(event) => updateExtractImagesSettings({ archiveName: event.currentTarget.value })} />
                    </SidebarField>
                    <SidebarCheckbox
                        checked={extractImagesSettings.includeRawStreams}
                        label="Include raw"
                        onChange={(event) => updateExtractImagesSettings({ includeRawStreams: event.currentTarget.checked })}
                    />
                </SidebarContent>
            </SidebarSection>
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
                                {image.blob ? "Download" : "Download Raw"}
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
                    ...(images.length > 0 ? [{ label: "Images", value: images.length, tone: "accent" as const }] : []),
                    ...(images.length > 0 ? [{ label: "Decoded", value: decodedCount }] : []),
                    ...(rawCount > 0 ? [{ label: "Raw", value: rawCount }] : []),
                ]}
                primaryAction={
                    file
                        ? { label: "Download ZIP", disabled: images.length === 0 || (!extractImagesSettings.includeRawStreams && decodedCount === 0), onClick: handleDownloadAll }
                        : undefined
                }
                secondaryActions={[{ label: "Replace", onClick: () => inputRef.current?.click() }]}
                status={isWorking ? { tone: "info", message: "Extracting images..." } : status}
            />
        </div>
    ) : (
        <EmptyState
            badgeIcon={<RiAddLine className="size-5" />}
            description="Every embedded raster image, decoded by the browser."
            fileInputId={fileInputId}
            onFiles={handleFiles}
            title="Drop a PDF to extract images"
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
            <ToolLayout onFiles={handleFiles} sidebar={sidebar} title="Extract Images">
                {centerContent}
            </ToolLayout>
        </>
    );
}
