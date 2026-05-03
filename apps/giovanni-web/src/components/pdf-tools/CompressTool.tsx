import { compressPdf, formatBytes, type CompressionResult, type DecodeLevel } from "@pdfly/wasm";
import * as React from "react";
import { RiAddLine, RiArrowDownSLine, RiFileZipLine } from "@remixicon/react";
import { ToolLayout } from "../ToolLayout";
import { EmptyState } from "../empty-state/EmptyState";
import { Input } from "../shadcn-ui/Input";
import { Sidebar, SidebarCheckbox, SidebarContent, SidebarField, SidebarFooter, SidebarHeader, SidebarSection, SidebarStat, SidebarToggle, SidebarToggleGroup } from "../sidebar";
import { Button } from "../shadcn-ui/Button";
import { downloadPdf, formatDuration, formatThroughput, isPdfFile, pdfBaseName } from "../../lib/pdf-tools/utils";
import { FileSummary, MetricGrid, ToolStatus, ToolStatusLine, ToolWorkspace } from "./PdfToolComponents";

type CompressionProfile = "balanced" | "extreme";

export function CompressTool() {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [file, setFile] = React.useState<File | null>(null);
    const [profile, setProfile] = React.useState<CompressionProfile>("balanced");
    const [decodeLevel, setDecodeLevel] = React.useState<DecodeLevel>("generalized");
    const [recompressFlate, setRecompressFlate] = React.useState(true);
    const [compressPages, setCompressPages] = React.useState(false);
    const [removeUnreferencedResources, setRemoveUnreferencedResources] = React.useState(false);
    const [result, setResult] = React.useState<CompressionResult | null>(null);
    const [elapsedMs, setElapsedMs] = React.useState<number | null>(null);
    const [status, setStatus] = React.useState<ToolStatus>(null);
    const [isWorking, setIsWorking] = React.useState(false);

    const compressionLevel = profile === "extreme" ? 9 : 6;

    const handleFiles = (files: File[]) => {
        const nextFile = files.find(isPdfFile);
        if (!nextFile) {
            setStatus({ tone: "error", message: "Please select a PDF file." });
            return;
        }

        setFile(nextFile);
        setResult(null);
        setElapsedMs(null);
        setStatus({ tone: "info", message: "PDF loaded. Choose a profile, then compress." });
    };

    const handleCompress = async () => {
        if (!file) {
            inputRef.current?.click();
            return;
        }

        setIsWorking(true);
        setStatus({ tone: "info", message: "Compressing PDF locally..." });

        try {
            const arrayBuffer = await file.arrayBuffer();
            const start = performance.now();
            const nextResult = await compressPdf(arrayBuffer, {
                compressionLevel,
                decodeLevel,
                recompressFlate,
                compressPages,
                removeUnreferencedResources,
                objectStreams: "generate",
            });
            const nextElapsedMs = performance.now() - start;

            setResult(nextResult);
            setElapsedMs(nextElapsedMs);
            setStatus({
                tone: "success",
                message: nextResult.savedBytes >= 0 ? `Compressed ${formatBytes(nextResult.savedBytes)} smaller.` : "Compression completed, but this PDF became larger.",
            });
        } catch (error) {
            setResult(null);
            setElapsedMs(null);
            setStatus({ tone: "error", message: error instanceof Error ? error.message : "Failed to compress PDF." });
        } finally {
            setIsWorking(false);
        }
    };

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
                        <Input
                            className="h-7 px-2 rounded-[4px] bg-[#111] border-[#282828] text-[12px] text-white focus-visible:ring-1 focus-visible:ring-[#eb5a3f] shadow-inner"
                            readOnly
                            value={compressionLevel}
                        />
                    </SidebarField>
                    <SidebarField label="Decode">
                        <div className="relative">
                            <select
                                className="h-7 w-full appearance-none rounded-[4px] border border-[#282828] bg-[#111] px-2 py-0 pr-7 text-[12px] leading-none text-white shadow-inner focus-visible:ring-1 focus-visible:ring-[#eb5a3f] focus-visible:outline-none"
                                value={decodeLevel}
                                onChange={(event) => setDecodeLevel(event.currentTarget.value as DecodeLevel)}
                            >
                                <option value="none">None</option>
                                <option value="generalized">Generalized</option>
                                <option value="specialized">Specialized</option>
                                <option value="all">All</option>
                            </select>
                            <RiArrowDownSLine className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-neutral-300" />
                        </div>
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

            <SidebarFooter>
                <SidebarStat label="Original Size" value={result ? formatBytes(result.originalSize) : file ? formatBytes(file.size) : "-"} />
                <SidebarStat label="New Size" value={result ? formatBytes(result.compressedSize) : "-"} isHighlight={Boolean(result)} />
                <SidebarStat label="Savings" value={result ? `${result.percentageSaved.toFixed(1)}%` : "-"} isHighlight={Boolean(result)} />
            </SidebarFooter>
        </Sidebar>
    );

    const visual = (
        <>
            <div className="absolute inset-x-0 h-24 bg-[#111] border border-[#222] rounded-3xl shadow-[inset_0_10px_20px_rgba(0,0,0,0.5)] transform scale-95 transition-transform duration-500 group-hover:scale-100 flex items-center justify-between px-2">
                <div className="w-2 h-12 bg-[#222] rounded-full shadow-[inset_1px_0_2px_rgba(255,255,255,0.1)]" />
                <div className="w-2 h-12 bg-[#222] rounded-full shadow-[inset_-1px_0_2px_rgba(255,255,255,0.1)]" />
            </div>
            <div className="relative w-16 h-20 bg-linear-to-br from-[#eb5a3f] to-[#b33e29] rounded-xl shadow-[0_10px_20px_rgba(235,90,63,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-[#ff7b63] flex flex-col items-center justify-center transition-all duration-500 group-hover:scale-95 group-hover:w-14 z-10">
                <RiFileZipLine className="size-6 text-white/90 drop-shadow-md" />
                <div className="absolute top-0 right-0 w-4 h-4 bg-linear-to-bl from-white/40 to-transparent rounded-bl-lg shadow-sm" />
            </div>
        </>
    );

    const renderContent = () => {
        if (!file) {
            return (
                <EmptyState
                    accept="application/pdf,.pdf"
                    badgeIcon={<RiAddLine className="size-5" />}
                    description="Secure, offline processing."
                    inputRef={inputRef}
                    onFiles={handleFiles}
                    title="Drop a PDF to compress"
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
                        {result && (
                            <Button size="sm" onClick={() => downloadPdf(result.data, `${pdfBaseName(file)}_compressed.pdf`)}>
                                Download
                            </Button>
                        )}
                    </>
                }
                description="The selected qpdf options run entirely in this browser."
                title="Compression Queue"
            >
                <input ref={inputRef} hidden accept="application/pdf,.pdf" type="file" onChange={(event) => handleFiles(Array.from(event.currentTarget.files ?? []))} />
                <FileSummary file={file} />
                <ToolStatusLine status={status} />
                {result && (
                    <MetricGrid
                        metrics={[
                            { label: "Original", value: formatBytes(result.originalSize) },
                            { label: "Compressed", value: formatBytes(result.compressedSize), tone: "accent" },
                            { label: "Saved", value: `${result.percentageSaved.toFixed(1)}%`, tone: "accent" },
                            { label: "Time", value: elapsedMs === null ? "-" : formatDuration(elapsedMs) },
                            { label: "Throughput", value: elapsedMs === null ? "-" : formatThroughput(result.originalSize, elapsedMs) },
                        ]}
                    />
                )}
            </ToolWorkspace>
        );
    };

    return (
        <ToolLayout isActionBusy={isWorking} actionText={file ? "Compress" : "Select PDF"} onAction={handleCompress} sidebar={sidebar} title="Compress PDF">
            {renderContent()}
        </ToolLayout>
    );
}
