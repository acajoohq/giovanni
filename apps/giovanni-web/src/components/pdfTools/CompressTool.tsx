import { compressPdf, formatBytes, type CompressionResult, type DecodeLevel } from "@pdfly/wasm";
import { RiAddLine } from "@remixicon/react";
import * as React from "react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { ComparisonSlider } from "@/components/ComparisonSlider";
import { EmptyState } from "@/components/emptyState/EmptyState";
import {
    Sidebar,
    SidebarCheckbox,
    SidebarContent,
    SidebarField,
    SidebarHeader,
    SidebarInput,
    SidebarSection,
    SidebarSelect,
    SidebarToggle,
    SidebarToggleGroup,
} from "@/components/sidebar";
import { useAsyncToolJob } from "@/lib/features/pdfTools/hooks/useAsyncToolJob";
import { downloadPdf, findFirstPdfFile, formatDuration, pdfBaseName } from "@/lib/features/pdfTools/utils/pdfToolUtils";
import { CompressVisual } from "@/components/pdfTools/visuals/PdfToolVisuals";
import { PdfPreview } from "@/components/pdfTools/PdfPreview";
import { ToolResultTray } from "@/components/pdfTools/ToolResultTray";

type CompressionProfile = "balanced" | "extreme";

const decodeLevelOptions: Array<{ label: string; value: DecodeLevel }> = [
    { label: "None", value: "none" },
    { label: "Generalized", value: "generalized" },
    { label: "Specialized", value: "specialized" },
    { label: "All", value: "all" },
];

export function CompressTool() {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [file, setFile] = React.useState<File | null>(null);
    const [profile, setProfile] = React.useState<CompressionProfile>("balanced");
    const [decodeLevel, setDecodeLevel] = React.useState<DecodeLevel>("generalized");
    const [recompressFlate, setRecompressFlate] = React.useState(true);
    const [compressPages, setCompressPages] = React.useState(false);
    const [removeUnreferencedResources, setRemoveUnreferencedResources] = React.useState(false);
    const { result, elapsedMs, status, isWorking, setStatus, reset, runJob } = useAsyncToolJob<CompressionResult>();

    const compressionLevel = profile === "extreme" ? 9 : 6;

    const processFile = React.useCallback(
        async (nextFile: File) => {
            await runJob({
                execute: async () => {
                    const buffer = await nextFile.arrayBuffer();

                    return compressPdf(buffer, {
                        compressionLevel,
                        decodeLevel,
                        recompressFlate,
                        compressPages,
                        removeUnreferencedResources,
                        objectStreams: "generate",
                    });
                },
                errorMessage: "Failed to compress PDF.",
                successStatus: (nextResult) => ({
                    tone: "success",
                    message: nextResult.savedBytes >= 0 ? `Saved ${formatBytes(nextResult.savedBytes)}.` : "Result is slightly larger.",
                }),
            });
        },
        [compressPages, compressionLevel, decodeLevel, recompressFlate, removeUnreferencedResources, runJob],
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

    const sidebar = (
        <Sidebar>
            <SidebarSection>
                <SidebarHeader>Compression</SidebarHeader>
                <SidebarContent>
                    <SidebarField label="Profile">
                        <SidebarToggleGroup>
                            <SidebarToggle isActive={profile === "balanced"} onClick={() => setProfile("balanced")}>
                                Balanced
                            </SidebarToggle>
                            <SidebarToggle isActive={profile === "extreme"} onClick={() => setProfile("extreme")}>
                                Extreme
                            </SidebarToggle>
                        </SidebarToggleGroup>
                    </SidebarField>
                    <SidebarField label="Level">
                        <SidebarInput readOnly value={compressionLevel} />
                    </SidebarField>
                    <SidebarField label="Decode">
                        <SidebarSelect options={decodeLevelOptions} value={decodeLevel} onValueChange={setDecodeLevel} />
                    </SidebarField>
                </SidebarContent>
            </SidebarSection>

            <SidebarSection>
                <SidebarHeader>Stream Options</SidebarHeader>
                <SidebarContent>
                    <SidebarCheckbox checked={recompressFlate} label="Recompress flate" onChange={(event) => setRecompressFlate(event.currentTarget.checked)} />
                    <SidebarCheckbox checked={compressPages} label="Compress pages" onChange={(event) => setCompressPages(event.currentTarget.checked)} />
                    <SidebarCheckbox
                        checked={removeUnreferencedResources}
                        label="Remove unused"
                        onChange={(event) => setRemoveUnreferencedResources(event.currentTarget.checked)}
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
            <input ref={inputRef} hidden accept="application/pdf,.pdf" type="file" onChange={(event) => handleFiles(Array.from(event.currentTarget.files ?? []))} />
            <ToolLayout onFiles={handleFiles} sidebar={sidebar} title="Compress PDF">
                {centerContent}
            </ToolLayout>
        </>
    );
}
