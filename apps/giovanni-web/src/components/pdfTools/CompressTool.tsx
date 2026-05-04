import { compressPdf, formatBytes, type CompressionResult, type DecodeLevel, type ObjectStreamMode } from "@pdfly/wasm";
import { RiAddLine } from "@remixicon/react";
import { useState, useRef } from "react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { ComparisonSlider } from "@/components/ComparisonSlider";
import { EmptyState } from "@/components/emptyState/EmptyState";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { SidebarCheckbox } from "@/components/sidebar/SidebarCheckbox";
import { SidebarContent } from "@/components/sidebar/SidebarContent";
import { SidebarField } from "@/components/sidebar/SidebarField";
import { SidebarHeader } from "@/components/sidebar/SidebarHeader";
import { SidebarRange, SidebarSelect } from "@/components/sidebar/SidebarControls";
import { SidebarSection } from "@/components/sidebar/SidebarSection";
import { useAsyncToolJob } from "@/lib/features/pdfTools/hooks/useAsyncToolJob";
import { downloadPdf, findFirstPdfFile, formatDuration, pdfBaseName } from "@/lib/features/pdfTools/utils/pdfToolUtils";
import { CompressVisual } from "@/components/pdfTools/visuals/CompressVisual";
import { PdfPreview } from "@/components/pdfTools/PdfPreview";
import { ToolResultTray } from "@/components/pdfTools/ToolResultTray";

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
    const inputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [compressionLevel, setCompressionLevel] = useState(6);
    const [decodeLevel, setDecodeLevel] = useState<DecodeLevel>("generalized");
    const [objectStreams, setObjectStreams] = useState<ObjectStreamMode>("generate");
    const [recompressFlate, setRecompressFlate] = useState(true);
    const [compressPages, setCompressPages] = useState(false);
    const [removeUnreferencedResources, setRemoveUnreferencedResources] = useState(false);
    const { result, elapsedMs, status, isWorking, setStatus, reset, runJob } = useAsyncToolJob<CompressionResult>();

    const compressionOptions = {
        compressionLevel,
        decodeLevel,
        objectStreams,
        recompressFlate,
        compressPages,
        removeUnreferencedResources,
    };

    const processFile = async (nextFile: File, options: CompressionOptions = compressionOptions) => {
        await runJob({
            execute: async () => {
                const buffer = await nextFile.arrayBuffer();

                return compressPdf(buffer, options);
            },
            errorMessage: "Failed to compress PDF.",
            successStatus: (nextResult) => ({
                tone: "success",
                message: nextResult.savedBytes >= 0 ? `Saved ${formatBytes(nextResult.savedBytes)}.` : "Result is slightly larger.",
            }),
        });
    };

    const processCurrentFile = (options: CompressionOptions) => {
        if (file) {
            void processFile(file, options);
        }
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

    const handleCompressionLevelChange = (nextCompressionLevel: number) => {
        const options = { ...compressionOptions, compressionLevel: nextCompressionLevel };

        setCompressionLevel(nextCompressionLevel);
        processCurrentFile(options);
    };

    const handleDecodeLevelChange = (nextDecodeLevel: DecodeLevel) => {
        const options = { ...compressionOptions, decodeLevel: nextDecodeLevel };

        setDecodeLevel(nextDecodeLevel);
        processCurrentFile(options);
    };

    const handleObjectStreamsChange = (nextObjectStreams: ObjectStreamMode) => {
        const options = { ...compressionOptions, objectStreams: nextObjectStreams };

        setObjectStreams(nextObjectStreams);
        processCurrentFile(options);
    };

    const handleRecompressFlateChange = (nextRecompressFlate: boolean) => {
        const options = { ...compressionOptions, recompressFlate: nextRecompressFlate };

        setRecompressFlate(nextRecompressFlate);
        processCurrentFile(options);
    };

    const handleCompressPagesChange = (nextCompressPages: boolean) => {
        const options = { ...compressionOptions, compressPages: nextCompressPages };

        setCompressPages(nextCompressPages);
        processCurrentFile(options);
    };

    const handleRemoveUnreferencedResourcesChange = (nextRemoveUnreferencedResources: boolean) => {
        const options = { ...compressionOptions, removeUnreferencedResources: nextRemoveUnreferencedResources };

        setRemoveUnreferencedResources(nextRemoveUnreferencedResources);
        processCurrentFile(options);
    };

    const sidebar = (
        <Sidebar>
            <SidebarSection>
                <SidebarHeader>Compression</SidebarHeader>
                <SidebarContent>
                    <SidebarField label="Level">
                        <SidebarRange max={9} min={1} value={compressionLevel} valueLabel={compressionLevel} onValueChange={handleCompressionLevelChange} />
                    </SidebarField>
                    <SidebarField label="Decode">
                        <SidebarSelect options={decodeLevelOptions} value={decodeLevel} onValueChange={handleDecodeLevelChange} />
                    </SidebarField>
                    <SidebarField label="Object streams">
                        <SidebarSelect options={objectStreamOptions} value={objectStreams} onValueChange={handleObjectStreamsChange} />
                    </SidebarField>
                </SidebarContent>
            </SidebarSection>

            <SidebarSection>
                <SidebarHeader>Stream Options</SidebarHeader>
                <SidebarContent>
                    <SidebarCheckbox checked={recompressFlate} label="Recompress flate" onChange={(event) => handleRecompressFlateChange(event.currentTarget.checked)} />
                    <SidebarCheckbox checked={compressPages} label="Compress pages" onChange={(event) => handleCompressPagesChange(event.currentTarget.checked)} />
                    <SidebarCheckbox
                        checked={removeUnreferencedResources}
                        label="Remove unused"
                        onChange={(event) => handleRemoveUnreferencedResourcesChange(event.currentTarget.checked)}
                    />
                </SidebarContent>
            </SidebarSection>
        </Sidebar>
    );

    const centerContent = file ? (
        <div className="relative h-full w-full">
            <ComparisonSlider after={result ? <PdfPreview data={result.data} /> : undefined} before={<PdfPreview file={file} />} isProcessing={isWorking} />
            <ToolResultTray
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
                              onClick: () => downloadPdf(result.data, `${pdfBaseName(file)}_compressed.pdf`),
                          }
                        : undefined
                }
                secondaryActions={[{ label: "Replace", onClick: () => inputRef.current?.click() }]}
                status={isWorking ? { tone: "info", message: "Compressing PDF..." } : status}
            />
        </div>
    ) : (
        <EmptyState
            accept="application/pdf,.pdf"
            badgeIcon={<RiAddLine className="size-5" />}
            description="Secure, offline processing."
            inputRef={inputRef}
            onFiles={handleFiles}
            title="Drop a PDF to compress"
            visual={<CompressVisual />}
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
            <ToolLayout onFiles={handleFiles} sidebar={sidebar} title="Compress PDF">
                {centerContent}
            </ToolLayout>
        </>
    );
}
