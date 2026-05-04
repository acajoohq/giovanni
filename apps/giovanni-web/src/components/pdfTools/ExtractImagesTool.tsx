import { extractImages, formatBytes, type ExtractedImage, type ExtractImagesResult } from "@pdfly/wasm";
import { RiAddLine } from "@remixicon/react";
import * as React from "react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { BeforeAfterView } from "@/components/BeforeAfterView";
import { EmptyState } from "@/components/emptyState/EmptyState";
import { Button } from "@/components/ui/shadcn/Button";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { SidebarCheckbox } from "@/components/sidebar/SidebarCheckbox";
import { SidebarContent } from "@/components/sidebar/SidebarContent";
import { SidebarField } from "@/components/sidebar/SidebarField";
import { SidebarHeader } from "@/components/sidebar/SidebarHeader";
import { SidebarInput } from "@/components/sidebar/SidebarControls";
import { SidebarSection } from "@/components/sidebar/SidebarSection";
import { useAsyncToolJob } from "@/lib/features/pdfTools/hooks/useAsyncToolJob";
import { useObjectUrls } from "@/lib/features/pdfTools/hooks/useObjectUrls";
import {
    buildExtractedImageEntries,
    downloadBlob,
    downloadZip,
    findFirstPdfFile,
    imageDownloadName,
    makeArchiveName,
    pdfBaseName,
} from "@/lib/features/pdfTools/utils/pdfToolUtils";
import { ExtractImagesVisual } from "@/components/pdfTools/visuals/ExtractImagesVisual";
import { ImageThumb } from "@/components/pdfTools/ImageThumb";
import { PdfPreview } from "@/components/pdfTools/PdfPreview";
import { ToolResultTray } from "@/components/pdfTools/ToolResultTray";

const EMPTY_IMAGES: ExtractedImage[] = [];

export function ExtractImagesTool() {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [file, setFile] = React.useState<File | null>(null);
    const [archiveName, setArchiveName] = React.useState("{basename}_images.zip");
    const [includeRawStreams, setIncludeRawStreams] = React.useState(false);
    const { result, status, isWorking, setStatus, reset, runJob } = useAsyncToolJob<ExtractImagesResult>();
    const images = result?.images ?? EMPTY_IMAGES;
    const getImageBlob = React.useCallback((image: ExtractedImage) => image.blob, []);
    const previewUrls = useObjectUrls(images, getImageBlob);

    const { decodedCount, rawCount } = React.useMemo(() => {
        let decodedImages = 0;

        for (const image of images) {
            if (image.blob) {
                decodedImages += 1;
            }
        }

        return { decodedCount: decodedImages, rawCount: images.length - decodedImages };
    }, [images]);

    const processFile = React.useCallback(
        async (nextFile: File) => {
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
                            nextDecodedCount += 1;
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
        },
        [runJob],
    );

    const handleFiles = React.useCallback(
        (files: File[]) => {
            const nextFile = findFirstPdfFile(files);

            if (!nextFile) {
                setStatus({ tone: "error", message: "Please select a PDF file." });
                return;
            }

            reset();
            setFile(nextFile);
        },
        [reset, setStatus],
    );

    React.useEffect(() => {
        if (file) {
            void processFile(file);
        }
    }, [file, processFile]);

    const downloadImage = React.useCallback(
        (image: ExtractedImage, index: number) => {
            const name = imageDownloadName(pdfBaseName(file), index, image);

            if (image.blob) {
                downloadBlob(image.blob, name);
                return;
            }

            downloadBlob(new Blob([image.bytes as BlobPart], { type: "application/octet-stream" }), name);
        },
        [file],
    );

    const handleDownloadAll = async () => {
        if (images.length === 0 || !file) {
            return;
        }

        const entries = await buildExtractedImageEntries(images, pdfBaseName(file), { includeRawStreams });

        if (Object.keys(entries).length === 0) {
            setStatus({ tone: "error", message: includeRawStreams ? "No images are available to bundle." : "No browser-ready images are available to bundle." });
            return;
        }

        try {
            await downloadZip(entries, makeArchiveName(archiveName, pdfBaseName(file)));
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
                        <SidebarInput value={archiveName} onChange={(event) => setArchiveName(event.currentTarget.value)} />
                    </SidebarField>
                    <SidebarCheckbox checked={includeRawStreams} label="Include raw" onChange={(event) => setIncludeRawStreams(event.currentTarget.checked)} />
                </SidebarContent>
            </SidebarSection>
        </Sidebar>
    );

    const imagesOutput = React.useMemo(
        () =>
            images.length > 0 ? (
                <div className="h-full w-full overflow-y-auto p-4 pb-24">
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                        {images.map((image, index) => (
                            <div key={`${image.objectKey}-${image.xobjectKey}-${index}`} className="space-y-2 [content-visibility:auto] [contain-intrinsic-size:210px]">
                                <ImageThumb image={image} index={index} url={previewUrls[index] ?? null} />
                                <Button className="w-full" size="sm" variant="secondary" onClick={() => downloadImage(image, index)}>
                                    {image.blob ? "Download" : "Download Raw"}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null,
        [downloadImage, images, previewUrls],
    );

    const centerContent = file ? (
        <div className="relative h-full w-full">
            <BeforeAfterView after={imagesOutput} before={<PdfPreview file={file} />} isProcessing={isWorking} />
            <ToolResultTray
                fileName={file.name}
                fileSize={formatBytes(file.size)}
                metrics={[
                    ...(images.length > 0 ? [{ label: "Images", value: images.length, tone: "accent" as const }] : []),
                    ...(images.length > 0 ? [{ label: "Decoded", value: decodedCount }] : []),
                    ...(rawCount > 0 ? [{ label: "Raw", value: rawCount }] : []),
                ]}
                primaryAction={
                    file ? { label: "Download ZIP", disabled: images.length === 0 || (!includeRawStreams && decodedCount === 0), onClick: handleDownloadAll } : undefined
                }
                secondaryActions={[{ label: "Replace", onClick: () => inputRef.current?.click() }]}
                status={isWorking ? { tone: "info", message: "Extracting images..." } : status}
            />
        </div>
    ) : (
        <EmptyState
            accept="application/pdf,.pdf"
            badgeIcon={<RiAddLine className="size-5" />}
            description="Every embedded raster image, decoded by the browser."
            inputRef={inputRef}
            onFiles={handleFiles}
            title="Drop a PDF to extract images"
            visual={<ExtractImagesVisual />}
        />
    );

    return (
        <>
            <input
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
