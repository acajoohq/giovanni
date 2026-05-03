import { compressPdf, formatBytes, type CompressionResult, type DecodeLevel } from "@pdfly/wasm";
import * as React from "react";
import { RiAddLine, RiFileZipLine } from "@remixicon/react";
import { ToolLayout } from "../ToolLayout";
import { ComparisonSlider } from "../ComparisonSlider";
import { EmptyState } from "../empty-state/EmptyState";
import { Input } from "../shadcn-ui/Input";
import { Button } from "../shadcn-ui/Button";
import { Sidebar, SidebarCheckbox, SidebarContent, SidebarField, SidebarSection, SidebarHeader, SidebarToggle, SidebarToggleGroup } from "../sidebar";
import { type ToolStatus } from "./ToolStatusLine";
import { downloadPdf, formatDuration, isPdfFile, pdfBaseName } from "../../lib/pdf-tools/utils";
import { PdfPreview } from "./PdfPreview";

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
        setStatus(null);
    };

    React.useEffect(() => {
        if (!file) return;
        let cancelled = false;

        const run = async () => {
            setIsWorking(true);
            setResult(null);
            setElapsedMs(null);

            try {
                const buffer = await file.arrayBuffer();
                if (cancelled) return;
                const start = performance.now();
                const nextResult = await compressPdf(buffer, {
                    compressionLevel,
                    decodeLevel,
                    recompressFlate,
                    compressPages,
                    removeUnreferencedResources,
                    objectStreams: "generate",
                });
                if (cancelled) return;
                setResult(nextResult);
                setElapsedMs(performance.now() - start);
                setStatus({
                    tone: "success",
                    message: nextResult.savedBytes >= 0 ? `Saved ${formatBytes(nextResult.savedBytes)}.` : "Result is slightly larger.",
                });
            } catch (error) {
                if (!cancelled) setStatus({ tone: "error", message: error instanceof Error ? error.message : "Failed to compress PDF." });
            } finally {
                if (!cancelled) setIsWorking(false);
            }
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [file]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleRecompress = () => {
        if (!file) {
            inputRef.current?.click();
            return;
        }
        setIsWorking(true);
        setResult(null);
        setElapsedMs(null);

        file.arrayBuffer().then((buffer) => {
            const start = performance.now();
            return compressPdf(buffer, {
                compressionLevel,
                decodeLevel,
                recompressFlate,
                compressPages,
                removeUnreferencedResources,
                objectStreams: "generate",
            }).then((r) => ({ r, start }));
        }).then((val) => {
            if (!val) return;
            setResult(val.r);
            setElapsedMs(performance.now() - val.start);
            setStatus({
                tone: "success",
                message: val.r.savedBytes >= 0 ? `Saved ${formatBytes(val.r.savedBytes)}.` : "Result is slightly larger.",
            });
        }).catch((error) => {
            setStatus({ tone: "error", message: error instanceof Error ? error.message : "Failed." });
        }).finally(() => {
            setIsWorking(false);
        });
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
                            className="h-7 rounded-[4px] border-[#282828] bg-[#111] px-2 text-[12px] text-white shadow-inner focus-visible:ring-1 focus-visible:ring-[#eb5a3f]"
                            readOnly
                            value={compressionLevel}
                        />
                    </SidebarField>
                    <SidebarField label="Decode">
                        <div className="relative">
                            <select
                                className="h-7 w-full appearance-none rounded-[4px] border border-[#282828] bg-[#111] px-2 py-0 pr-7 text-[12px] leading-none text-white shadow-inner focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#eb5a3f]"
                                value={decodeLevel}
                                onChange={(event) => setDecodeLevel(event.currentTarget.value as DecodeLevel)}
                            >
                                <option value="none">None</option>
                                <option value="generalized">Generalized</option>
                                <option value="specialized">Specialized</option>
                                <option value="all">All</option>
                            </select>
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

            {result && (
                <SidebarSection>
                    <SidebarContent>
                        {/* Size reduction bar */}
                        <div>
                            <div className="mb-1.5 flex items-center justify-between">
                                <span className="text-[10px] uppercase tracking-wide text-neutral-600">Size</span>
                                <span className="text-[11px]">
                                    <span className="text-neutral-400">{formatBytes(result.originalSize)}</span>
                                    <span className="mx-1 text-neutral-700">→</span>
                                    <span className="text-[#eb5a3f]">{formatBytes(result.compressedSize)}</span>
                                </span>
                            </div>
                            <div className="h-1 w-full overflow-hidden rounded-full bg-[#1e1e1e]">
                                <div
                                    className="h-full rounded-full bg-[#eb5a3f] transition-all duration-500"
                                    style={{ width: `${Math.max(2, (result.compressedSize / result.originalSize) * 100)}%` }}
                                />
                            </div>
                        </div>

                        <div className="flex items-baseline justify-between">
                            <span className="text-[10px] uppercase tracking-wide text-neutral-600">Saved</span>
                            <span className="text-[16px] font-semibold text-[#eb5a3f]">{result.percentageSaved.toFixed(1)}%</span>
                        </div>

                        {elapsedMs !== null && (
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase tracking-wide text-neutral-600">Time</span>
                                <span className="text-[11px] text-neutral-500">{formatDuration(elapsedMs)}</span>
                            </div>
                        )}
                    </SidebarContent>
                </SidebarSection>
            )}
        </Sidebar>
    );

    const visual = (
        <>
            <div className="absolute inset-x-0 h-24 flex items-center justify-between rounded-3xl border border-[#222] bg-[#111] px-2 shadow-[inset_0_10px_20px_rgba(0,0,0,0.5)]">
                <div className="h-12 w-2 rounded-full bg-[#222] shadow-[inset_1px_0_2px_rgba(255,255,255,0.1)]" />
                <div className="h-12 w-2 rounded-full bg-[#222] shadow-[inset_-1px_0_2px_rgba(255,255,255,0.1)]" />
            </div>
            <div className="relative z-10 flex h-20 w-16 flex-col items-center justify-center rounded-xl border border-[#ff7b63] bg-linear-to-br from-[#eb5a3f] to-[#b33e29] shadow-[0_10px_20px_rgba(235,90,63,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] transition-all duration-500 group-hover:w-14 group-hover:scale-95">
                <RiFileZipLine className="size-6 text-white/90 drop-shadow-md" />
                <div className="absolute right-0 top-0 h-4 w-4 rounded-bl-lg bg-linear-to-bl from-white/40 to-transparent shadow-sm" />
            </div>
        </>
    );

    const footerSlot =
        result && file ? (
            <Button className="h-8 w-full rounded-[4px] text-[12px] font-medium" variant="secondary" onClick={() => downloadPdf(result.data, `${pdfBaseName(file)}_compressed.pdf`)}>
                Download Compressed
            </Button>
        ) : null;

    const centerContent = file ? (
        <div className="relative h-full w-full">
            <ComparisonSlider
                after={result ? <PdfPreview data={result.data} /> : undefined}
                before={<PdfPreview file={file} />}
                isProcessing={isWorking}
            />

            {/* Floating file info */}
            <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2.5 rounded-lg border border-white/8 bg-black/60 px-3 py-1.5">
                <span className="max-w-[200px] truncate text-[11px] text-neutral-300">{file.name}</span>
                <span className="text-[10px] text-neutral-600">{formatBytes(file.size)}</span>
                <button
                    className="ml-0.5 text-[10px] text-neutral-500 transition-colors hover:text-neutral-300"
                    onClick={() => inputRef.current?.click()}
                    type="button"
                >
                    Replace
                </button>
            </div>

            {/* Status toast */}
            {status && (
                <div className={`absolute right-3 top-3 z-30 rounded-md border px-3 py-1.5 text-[11px] ${status.tone === "error" ? "border-red-900/50 bg-red-950/60 text-red-400" : "border-[#2a2a2a] bg-black/60 text-neutral-400"}`}>
                    {status.message}
                </div>
            )}
        </div>
    ) : (
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

    return (
        <>
            <input ref={inputRef} hidden accept="application/pdf,.pdf" type="file" onChange={(event) => handleFiles(Array.from(event.currentTarget.files ?? []))} />
            <ToolLayout
                actionText={file ? "Re-compress" : "Select PDF"}
                footerSlot={footerSlot}
                isActionBusy={isWorking}
                isActionDisabled={!file}
                onAction={handleRecompress}
                sidebar={sidebar}
                title="Compress PDF"
            >
                {centerContent}
            </ToolLayout>
        </>
    );
}
