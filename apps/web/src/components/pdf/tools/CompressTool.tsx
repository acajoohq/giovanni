import { formatBytes, optimizePdf, type OptimizeResult, type DecodeLevel, type ObjectStreamMode } from "@pdfly/wasm";
import { RiAddLine, RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";
import { useId, useRef, useState } from "react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { ComparisonSlider } from "@/components/viewer/ComparisonSlider";
import { EmptyState } from "@/components/emptyState/EmptyState";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { SidebarCheckbox } from "@/components/sidebar/SidebarCheckbox";
import { SidebarContent } from "@/components/sidebar/SidebarContent";
import { SidebarField } from "@/components/sidebar/SidebarField";
import { SidebarHeader } from "@/components/sidebar/SidebarHeader";
import { SidebarRange, SidebarSelect } from "@/components/sidebar/SidebarControls";
import { SidebarSection } from "@/components/sidebar/SidebarSection";
import { EmptyCompress } from "@/components/pdf/emptyState/EmptyCompress";
import { PdfPreview } from "@/components/pdf/PdfPreview";
import { ResultTray } from "@/components/pdf/ResultTray";
import { PDF_WASM_SIDE_EFFECT_DEBOUNCE_MS } from "@/constants/pdfToolDebounce";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { useAsyncToolJob } from "@/hooks/pdf/useAsyncToolJob";
import { downloadPdf, findFirstPdfFile, formatDuration, pdfBaseName } from "@/utils/pdf/pdfToolUtils";

const decodeLevelOptions: Array<{ label: string; value: DecodeLevel }> = [
    { label: "None", value: "none" },
    { label: "Generalized", value: "generalized" },
    { label: "Specialized", value: "specialized" },
    { label: "All", value: "all" },
];

const objectStreamOptions: Array<{ label: string; value: ObjectStreamMode }> = [
    { label: "Generate", value: "generate" },
    { label: "Preserve", value: "preserve" },
    { label: "Disable", value: "disable" },
];

interface CompressionOptions {
    compressionLevel: number;
    decodeLevel: DecodeLevel;
    objectStreams: ObjectStreamMode;
    recompressFlate: boolean;
    compressPages: boolean;
    removeUnreferencedResources: boolean;
}

export function CompressTool() {
    const fileInputId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [previewPage, setPreviewPage] = useState(1);
    const [previewPageCount, setPreviewPageCount] = useState(0);
    const [compressionOptions, setCompressionOptions] = useState<CompressionOptions>({
        compressionLevel: 6,
        decodeLevel: "generalized",
        objectStreams: "generate",
        recompressFlate: true,
        compressPages: false,
        removeUnreferencedResources: false,
    });
    const { result, elapsedMs, status, isWorking, setStatus, reset, runJob } = useAsyncToolJob<OptimizeResult>();

    const processFile = async (nextFile: File, options: CompressionOptions = compressionOptions) => {
        await runJob({
            execute: async () => {
                const buffer = await nextFile.arrayBuffer();

                return optimizePdf(buffer, options);
            },
            errorMessage: "Failed to compress PDF.",
            successStatus: (nextResult) =>
                nextResult.savedBytes >= 0 ? { tone: "success", message: `Saved ${formatBytes(nextResult.savedBytes)}.` } : { tone: "info", message: "Result is slightly larger." },
        });
    };

    const debouncedProcessFile = useDebouncedCallback((nextFile: File, nextOptions: CompressionOptions) => {
        void processFile(nextFile, nextOptions);
    }, PDF_WASM_SIDE_EFFECT_DEBOUNCE_MS);

    const scheduleRecompress = (nextOptions: CompressionOptions) => {
        if (!file) {
            debouncedProcessFile.cancel();
            return;
        }

        debouncedProcessFile(file, nextOptions);
    };

    const updateCompressionOptions = (patch: Partial<CompressionOptions>) => {
        const nextOptions = { ...compressionOptions, ...patch };
        setCompressionOptions(nextOptions);
        scheduleRecompress(nextOptions);
    };

    const handleFiles = (files: File[]) => {
        const nextFile = findFirstPdfFile(files);

        if (!nextFile) {
            setStatus({ tone: "error", message: "Please select a PDF file." });
            return;
        }

        reset();
        debouncedProcessFile.cancel();
        setPreviewPage(1);
        setPreviewPageCount(0);
        setFile(nextFile);
        void processFile(nextFile);
    };

    const updatePreviewPage = (nextPage: number | ((currentPage: number) => number)) => {
        setPreviewPage((currentPage) => {
            const resolvedPage = typeof nextPage === "function" ? nextPage(currentPage) : nextPage;
            const maxPage = previewPageCount > 0 ? previewPageCount : 1;

            return Math.max(1, Math.min(maxPage, resolvedPage));
        });
    };

    const handleDownload = (data: Uint8Array, fileName: string) => {
        try {
            downloadPdf(data, fileName);
        } catch (error) {
            console.error("Failed to download compressed PDF", error);
            setStatus({ tone: "error", message: error instanceof Error ? error.message : "Could not download PDF." });
        }
    };

    const sidebar = (
        <Sidebar>
            <SidebarSection>
                <SidebarHeader>Compression</SidebarHeader>
                <SidebarContent>
                    <SidebarField label="Level">
                        <SidebarRange
                            max={9}
                            min={1}
                            value={compressionOptions.compressionLevel}
                            valueLabel={compressionOptions.compressionLevel}
                            onValueChange={(compressionLevel) => updateCompressionOptions({ compressionLevel })}
                        />
                    </SidebarField>
                    <SidebarField label="Decode">
                        <SidebarSelect
                            options={decodeLevelOptions}
                            value={compressionOptions.decodeLevel}
                            onValueChange={(decodeLevel) => updateCompressionOptions({ decodeLevel })}
                        />
                    </SidebarField>
                    <SidebarField label="Object streams">
                        <SidebarSelect
                            options={objectStreamOptions}
                            value={compressionOptions.objectStreams}
                            onValueChange={(objectStreams) => updateCompressionOptions({ objectStreams })}
                        />
                    </SidebarField>
                </SidebarContent>
            </SidebarSection>

            <SidebarSection>
                <SidebarHeader>Stream Options</SidebarHeader>
                <SidebarContent>
                    <SidebarCheckbox
                        checked={compressionOptions.recompressFlate}
                        label="Recompress flate"
                        onChange={(event) => updateCompressionOptions({ recompressFlate: event.currentTarget.checked })}
                    />
                    <SidebarCheckbox
                        checked={compressionOptions.compressPages}
                        label="Compress pages"
                        onChange={(event) => updateCompressionOptions({ compressPages: event.currentTarget.checked })}
                    />
                    <SidebarCheckbox
                        checked={compressionOptions.removeUnreferencedResources}
                        label="Remove unused"
                        onChange={(event) => updateCompressionOptions({ removeUnreferencedResources: event.currentTarget.checked })}
                    />
                </SidebarContent>
            </SidebarSection>
        </Sidebar>
    );

    const centerContent = file ? (
        <div className="relative h-full w-full">
            <ComparisonSlider
                after={result ? <PdfPreview data={result.data} page={previewPage} showControls={false} onPageChange={updatePreviewPage} /> : undefined}
                before={<PdfPreview file={file} page={previewPage} showControls={false} onPageChange={updatePreviewPage} onPageCountChange={setPreviewPageCount} />}
                isProcessing={isWorking}
            />
            {previewPageCount > 1 && (
                <div className="absolute bottom-30 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-md border border-app-border bg-app-panel px-2 py-1 md:bottom-24">
                    <button
                        className="flex size-6 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-app-control-hover hover:text-white disabled:opacity-30"
                        disabled={previewPage === 1}
                        type="button"
                        onClick={() => updatePreviewPage((currentPage) => currentPage - 1)}
                    >
                        <RiArrowLeftSLine className="size-4" />
                    </button>
                    <span className="min-w-[52px] text-center text-[11px] font-medium text-neutral-400">
                        {previewPage} / {previewPageCount}
                    </span>
                    <button
                        className="flex size-6 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-app-control-hover hover:text-white disabled:opacity-30"
                        disabled={previewPage === previewPageCount}
                        type="button"
                        onClick={() => updatePreviewPage((currentPage) => currentPage + 1)}
                    >
                        <RiArrowRightSLine className="size-4" />
                    </button>
                </div>
            )}
            <ResultTray
                fileName={file.name}
                fileSize={formatBytes(file.size)}
                metrics={
                    result
                        ? [
                              { label: "Saved", value: `${result.percentageSaved.toFixed(1)}%`, tone: "accent" },
                              { label: "Output", value: formatBytes(result.compressedSize) },
                              ...(elapsedMs !== null ? [{ label: "Time", value: formatDuration(elapsedMs) }] : []),
                          ]
                        : []
                }
                primaryAction={
                    result
                        ? {
                              label: "Download PDF",
                              onClick: () => handleDownload(result.data, `${pdfBaseName(file)}_compressed.pdf`),
                          }
                        : undefined
                }
                secondaryActions={[{ label: "Replace", onClick: () => inputRef.current?.click() }]}
                status={isWorking ? { tone: "info", message: "Compressing PDF..." } : status}
            />
        </div>
    ) : (
        <EmptyState
            badgeIcon={<RiAddLine className="size-5" />}
            description="Secure, offline processing."
            fileInputId={fileInputId}
            onFiles={handleFiles}
            title="Drop a PDF to compress"
            visual={<EmptyCompress />}
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
            <ToolLayout onFiles={handleFiles} sidebar={sidebar} title="Compress PDF">
                {centerContent}
            </ToolLayout>
        </>
    );
}
