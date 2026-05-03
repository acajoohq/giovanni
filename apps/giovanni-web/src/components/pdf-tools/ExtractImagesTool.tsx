import { extractImages, formatBytes, type ExtractedImage } from "@pdfly/wasm";
import * as React from "react";
import { RiAddLine, RiImageLine } from "@remixicon/react";
import { ToolLayout } from "../ToolLayout";
import { EmptyState } from "../empty-state/EmptyState";
import { Button } from "../shadcn-ui/Button";
import { Sidebar, SidebarContent, SidebarField, SidebarFooter, SidebarHeader, SidebarInfo, SidebarSection, SidebarStat } from "../sidebar";
import { FileSummary, ImageThumb, MetricGrid, ToolStatus, ToolStatusLine, ToolWorkspace } from "./ToolUi";
import { downloadBlob, downloadZip, formatDuration, formatThroughput, imageDownloadName, isPdfFile, pdfBaseName } from "./ToolUtils";

export function ExtractImagesTool() {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [file, setFile] = React.useState<File | null>(null);
    const [images, setImages] = React.useState<ExtractedImage[]>([]);
    const [previewUrls, setPreviewUrls] = React.useState<Array<string | null>>([]);
    const [elapsedMs, setElapsedMs] = React.useState<number | null>(null);
    const [status, setStatus] = React.useState<ToolStatus>(null);
    const [isWorking, setIsWorking] = React.useState(false);

    React.useEffect(() => {
        const urls = images.map((image) => (image.blob ? URL.createObjectURL(image.blob) : null));
        setPreviewUrls(urls);

        return () => {
            for (const url of urls) {
                if (url) {
                    URL.revokeObjectURL(url);
                }
            }
        };
    }, [images]);

    const decodedCount = images.filter((image) => image.blob !== null).length;
    const rawCount = images.length - decodedCount;

    const handleFiles = (files: File[]) => {
        const nextFile = files.find(isPdfFile);
        if (!nextFile) {
            setStatus({ tone: "error", message: "Please select a PDF file." });
            return;
        }

        setFile(nextFile);
        setImages([]);
        setElapsedMs(null);
        setStatus({ tone: "info", message: "PDF loaded. Extract embedded raster images." });
    };

    const handleExtract = async () => {
        if (!file) {
            inputRef.current?.click();
            return;
        }

        setIsWorking(true);
        setStatus({ tone: "info", message: "Extracting images locally..." });

        try {
            const arrayBuffer = await file.arrayBuffer();
            const start = performance.now();
            const result = await extractImages(arrayBuffer);
            const nextElapsedMs = performance.now() - start;
            const nextDecodedCount = result.images.filter((image) => image.blob !== null).length;
            const nextRawCount = result.imageCount - nextDecodedCount;

            setImages(result.images);
            setElapsedMs(nextElapsedMs);
            setStatus({
                tone: result.imageCount > 0 ? "success" : "info",
                message:
                    result.imageCount === 0
                        ? "No embedded raster images were found."
                        : `Extracted ${nextDecodedCount} browser-ready ${nextDecodedCount === 1 ? "image" : "images"}${nextRawCount > 0 ? ` and ${nextRawCount} raw streams` : ""}.`,
            });
        } catch (error) {
            setImages([]);
            setElapsedMs(null);
            setStatus({ tone: "error", message: error instanceof Error ? error.message : "Failed to extract images." });
        } finally {
            setIsWorking(false);
        }
    };

    const handleDownloadAll = async () => {
        if (images.length === 0 || !file) {
            return;
        }

        const entries: Record<string, Uint8Array> = {};
        for (const [index, image] of images.entries()) {
            if (!image.blob) {
                continue;
            }

            entries[imageDownloadName(pdfBaseName(file), index, image)] = new Uint8Array(await image.blob.arrayBuffer());
        }

        if (Object.keys(entries).length === 0) {
            setStatus({ tone: "error", message: "No browser-ready images are available to bundle." });
            return;
        }

        try {
            await downloadZip(entries, `${pdfBaseName(file)}_images.zip`);
        } catch (error) {
            setStatus({ tone: "error", message: error instanceof Error ? error.message : "Could not create ZIP." });
        }
    };

    const downloadImage = (image: ExtractedImage, index: number) => {
        const name = imageDownloadName(pdfBaseName(file), index, image);
        if (image.blob) {
            downloadBlob(image.blob, name);
            return;
        }
        downloadBlob(new Blob([image.bytes as BlobPart], { type: "application/octet-stream" }), name);
    };

    const sidebar = (
        <Sidebar>
            <SidebarSection>
                <SidebarHeader>Extraction</SidebarHeader>
                <SidebarContent>
                    <SidebarField label="Images">
                        <div className="flex h-7 items-center rounded-[4px] border border-[#282828] bg-[#111] px-2 text-[12px] leading-none text-neutral-300 shadow-inner">
                            Raster XObjects
                        </div>
                    </SidebarField>
                </SidebarContent>
            </SidebarSection>

            <SidebarInfo>JPEG and compatible raw-pixel streams are downloadable as browser image files. Unsupported streams remain available as raw bytes.</SidebarInfo>

            <SidebarFooter>
                <SidebarStat label="Source Size" value={file ? formatBytes(file.size) : "-"} />
                <SidebarStat label="Images" value={images.length || "-"} isHighlight={images.length > 0} />
                <SidebarStat label="Decoded" value={decodedCount || "-"} isHighlight={decodedCount > 0} />
            </SidebarFooter>
        </Sidebar>
    );

    const visual = (
        <>
            <div className="absolute w-20 h-20 rounded-2xl border border-[#333] bg-[#121212] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_14px_30px_rgba(0,0,0,0.35)] transition-transform duration-500 group-hover:rotate-3" />
            <div className="absolute w-14 h-14 rounded-xl border border-[#ff7b63] bg-linear-to-br from-[#eb5a3f] to-[#8f3426] shadow-[0_10px_22px_rgba(235,90,63,0.28)] flex items-center justify-center transition-all duration-500 group-hover:scale-110">
                <RiImageLine className="size-7 text-white/90" />
            </div>
        </>
    );

    const renderContent = () => {
        if (!file) {
            return (
                <EmptyState
                    accept="application/pdf,.pdf"
                    badgeIcon={<RiAddLine className="size-5" />}
                    description="Every embedded raster image, decoded by the browser."
                    inputRef={inputRef}
                    onFiles={handleFiles}
                    title="Drop a PDF to extract images"
                    visual={visual}
                />
            );
        }

        return (
            <ToolWorkspace
                actions={
                    <>
                        <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
                            Replace
                        </Button>
                        <Button disabled={decodedCount === 0} size="sm" onClick={handleDownloadAll}>
                            Download ZIP
                        </Button>
                    </>
                }
                description="Previews are created only for decoded image streams."
                title="Image Extraction"
            >
                <input ref={inputRef} hidden accept="application/pdf,.pdf" type="file" onChange={(event) => handleFiles(Array.from(event.currentTarget.files ?? []))} />
                <FileSummary file={file} />
                <ToolStatusLine status={status} />
                {images.length > 0 && (
                    <>
                        <MetricGrid
                            metrics={[
                                { label: "Images", value: images.length, tone: "accent" },
                                { label: "Decoded", value: decodedCount, tone: "accent" },
                                { label: "Raw", value: rawCount },
                                { label: "Time", value: elapsedMs === null ? "-" : formatDuration(elapsedMs) },
                                { label: "Throughput", value: elapsedMs === null ? "-" : formatThroughput(file.size, elapsedMs) },
                            ]}
                        />
                        <div className="grid max-h-[420px] grid-cols-2 gap-3 overflow-y-auto pr-1 custom-scrollbar md:grid-cols-3">
                            {images.map((image, index) => (
                                <div key={`${image.objectKey}-${image.xobjectKey}-${index}`} className="space-y-2">
                                    <ImageThumb image={image} index={index} url={previewUrls[index] ?? null} />
                                    <Button className="w-full" size="sm" variant="secondary" onClick={() => downloadImage(image, index)}>
                                        {image.blob ? "Download" : "Download Raw"}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </ToolWorkspace>
        );
    };

    return (
        <ToolLayout isActionBusy={isWorking} actionText={file ? "Extract Images" : "Select PDF"} onAction={handleExtract} sidebar={sidebar} title="Extract Images">
            {renderContent()}
        </ToolLayout>
    );
}
