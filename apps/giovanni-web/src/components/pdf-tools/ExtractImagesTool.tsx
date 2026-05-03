import { extractImages, formatBytes, type ExtractedImage } from "@pdfly/wasm";
import * as React from "react";
import { RiAddLine, RiImageLine } from "@remixicon/react";
import { ToolLayout } from "../ToolLayout";
import { BeforeAfterView } from "../BeforeAfterView";
import { EmptyState } from "../empty-state/EmptyState";
import { Button } from "../shadcn-ui/Button";
import { Sidebar, SidebarContent, SidebarField, SidebarFooter, SidebarHeader, SidebarSection, SidebarStat } from "../sidebar";
import { FileSummary } from "./FileSummary";
import { ImageThumb } from "./ImageThumb";
import { type ToolStatus, ToolStatusLine } from "./ToolStatusLine";
import { downloadBlob, downloadZip, isPdfFile, pdfBaseName, imageDownloadName } from "../../lib/pdf-tools/utils";
import { PdfPreview } from "./PdfPreview";

export function ExtractImagesTool() {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [file, setFile] = React.useState<File | null>(null);
    const [images, setImages] = React.useState<ExtractedImage[]>([]);
    const [previewUrls, setPreviewUrls] = React.useState<Array<string | null>>([]);
    const [status, setStatus] = React.useState<ToolStatus>(null);
    const [isWorking, setIsWorking] = React.useState(false);

    React.useEffect(() => {
        const urls = images.map((image) => (image.blob ? URL.createObjectURL(image.blob) : null));
        setPreviewUrls(urls);
        return () => {
            for (const url of urls) {
                if (url) URL.revokeObjectURL(url);
            }
        };
    }, [images]);

    const decodedCount = images.filter((image) => image.blob !== null).length;

    const handleFiles = (files: File[]) => {
        const nextFile = files.find(isPdfFile);
        if (!nextFile) {
            setStatus({ tone: "error", message: "Please select a PDF file." });
            return;
        }
        setFile(nextFile);
        setImages([]);
        setStatus(null);
    };

    React.useEffect(() => {
        if (!file) return;
        let cancelled = false;

        const run = async () => {
            setIsWorking(true);
            setImages([]);

            try {
                const buffer = await file.arrayBuffer();
                if (cancelled) return;
                const result = await extractImages(buffer);
                if (cancelled) return;
                const nextDecodedCount = result.images.filter((img) => img.blob !== null).length;
                const nextRawCount = result.imageCount - nextDecodedCount;
                setImages(result.images);
                setStatus({
                    tone: result.imageCount > 0 ? "success" : "info",
                    message:
                        result.imageCount === 0
                            ? "No embedded raster images were found."
                            : `Extracted ${nextDecodedCount} browser-ready ${nextDecodedCount === 1 ? "image" : "images"}${nextRawCount > 0 ? ` and ${nextRawCount} raw streams` : ""}.`,
                });
            } catch (error) {
                if (!cancelled) setStatus({ tone: "error", message: error instanceof Error ? error.message : "Failed to extract images." });
            } finally {
                if (!cancelled) setIsWorking(false);
            }
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [file]); // eslint-disable-line react-hooks/exhaustive-deps

    const downloadImage = (image: ExtractedImage, index: number) => {
        const name = imageDownloadName(pdfBaseName(file), index, image);
        if (image.blob) {
            downloadBlob(image.blob, name);
            return;
        }
        downloadBlob(new Blob([image.bytes as BlobPart], { type: "application/octet-stream" }), name);
    };

    const handleDownloadAll = async () => {
        if (images.length === 0 || !file) return;
        const entries: Record<string, Uint8Array> = {};
        for (const [index, image] of images.entries()) {
            if (!image.blob) continue;
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

    const sidebar = (
        <Sidebar>
            {file && (
                <SidebarSection>
                    <SidebarContent>
                        <FileSummary file={file} />
                        <Button className="w-full" size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
                            Replace PDF
                        </Button>
                        <ToolStatusLine status={status} />
                    </SidebarContent>
                </SidebarSection>
            )}

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

            <SidebarFooter>
                <SidebarStat label="Source Size" value={file ? formatBytes(file.size) : "-"} />
                <SidebarStat isHighlight={images.length > 0} label="Images" value={images.length || "-"} />
                <SidebarStat isHighlight={decodedCount > 0} label="Decoded" value={decodedCount || "-"} />
            </SidebarFooter>
        </Sidebar>
    );

    const visual = (
        <>
            <div className="absolute h-20 w-20 rounded-2xl border border-[#333] bg-[#121212] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_14px_30px_rgba(0,0,0,0.35)] transition-transform duration-500 group-hover:rotate-3" />
            <div className="absolute flex h-14 w-14 items-center justify-center rounded-xl border border-[#ff7b63] bg-linear-to-br from-[#eb5a3f] to-[#8f3426] shadow-[0_10px_22px_rgba(235,90,63,0.28)] transition-all duration-500 group-hover:scale-110">
                <RiImageLine className="size-7 text-white/90" />
            </div>
        </>
    );

    const imagesOutput =
        images.length > 0 ? (
            <div className="h-full w-full overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                    {images.map((image, index) => (
                        <div key={`${image.objectKey}-${image.xobjectKey}-${index}`} className="space-y-2">
                            <ImageThumb image={image} index={index} url={previewUrls[index] ?? null} />
                            <Button className="w-full" size="sm" variant="secondary" onClick={() => downloadImage(image, index)}>
                                {image.blob ? "Download" : "Download Raw"}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        ) : undefined;

    const footerSlot = file ? (
        <Button className="h-8 w-full rounded-[4px] text-[12px] font-medium" disabled={decodedCount === 0} variant="secondary" onClick={handleDownloadAll}>
            Download ZIP
        </Button>
    ) : null;

    const centerContent = file ? (
        <BeforeAfterView after={imagesOutput} before={<PdfPreview file={file} />} isProcessing={isWorking} />
    ) : (
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

    return (
        <>
            <input ref={inputRef} hidden accept="application/pdf,.pdf" type="file" onChange={(event) => handleFiles(Array.from(event.currentTarget.files ?? []))} />
            <ToolLayout
                actionText={file ? "Re-extract" : "Select PDF"}
                footerSlot={footerSlot}
                isActionBusy={isWorking}
                isActionDisabled={!file}
                onAction={() => {
                    if (!file) inputRef.current?.click();
                }}
                sidebar={sidebar}
                title="Extract Images"
            >
                {centerContent}
            </ToolLayout>
        </>
    );
}
