import { formatBytes, mergePdfs } from "@pdfly/wasm";
import * as React from "react";
import { RiAddLine, RiStackLine } from "@remixicon/react";
import { ToolLayout } from "../ToolLayout";
import { EmptyState } from "../empty-state/EmptyState";
import { Button } from "../shadcn-ui/Button";
import { Input } from "../shadcn-ui/Input";
import { Sidebar, SidebarContent, SidebarField, SidebarFooter, SidebarHeader, SidebarInfo, SidebarSection, SidebarStat } from "../sidebar";
import { FilesList, MetricGrid, ToolStatus, ToolStatusLine } from "./PdfToolComponents";
import { downloadPdf, formatDuration, formatThroughput, isPdfFile } from "../../lib/pdf-tools/utils";
import { PdfPreview } from "./PdfPreview";

export function MergeTool() {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [files, setFiles] = React.useState<File[]>([]);
    const [outputName, setOutputName] = React.useState("merged.pdf");
    const [mergedData, setMergedData] = React.useState<Uint8Array | null>(null);
    const [elapsedMs, setElapsedMs] = React.useState<number | null>(null);
    const [status, setStatus] = React.useState<ToolStatus>(null);
    const [isWorking, setIsWorking] = React.useState(false);

    const totalInputBytes = files.reduce((sum, file) => sum + file.size, 0);

    const handleFiles = (nextFiles: File[]) => {
        const pdfs = nextFiles.filter(isPdfFile);
        if (pdfs.length === 0) {
            setStatus({ tone: "error", message: "Please select PDF files only." });
            return;
        }

        setFiles((current) => [...current, ...pdfs]);
        setMergedData(null);
        setElapsedMs(null);
        setStatus({ tone: "info", message: pdfs.length === 1 ? "Added 1 PDF. Add at least one more to merge." : `Added ${pdfs.length} PDFs.` });
    };

    const handleRemove = (index: number) => {
        setFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
        setMergedData(null);
        setElapsedMs(null);
    };

    const handleMove = (index: number, direction: -1 | 1) => {
        setFiles((current) => {
            const target = index + direction;
            if (target < 0 || target >= current.length) {
                return current;
            }

            const next = [...current];
            const [file] = next.splice(index, 1);
            if (file) {
                next.splice(target, 0, file);
            }
            return next;
        });
        setMergedData(null);
        setElapsedMs(null);
    };

    const handleMerge = async () => {
        if (files.length === 0) {
            inputRef.current?.click();
            return;
        }
        if (files.length < 2) {
            setStatus({ tone: "error", message: "Add at least 2 PDFs to merge." });
            return;
        }

        setIsWorking(true);
        setStatus({ tone: "info", message: "Merging PDFs locally..." });

        try {
            const buffers = await Promise.all(files.map((file) => file.arrayBuffer()));
            const start = performance.now();
            const result = await mergePdfs(buffers);
            const nextElapsedMs = performance.now() - start;

            setMergedData(result.data);
            setElapsedMs(nextElapsedMs);
            setStatus({ tone: "success", message: `Merged ${result.sourceCount} PDFs into one file.` });
        } catch (error) {
            setMergedData(null);
            setElapsedMs(null);
            setStatus({ tone: "error", message: error instanceof Error ? error.message : "Failed to merge PDFs." });
        } finally {
            setIsWorking(false);
        }
    };

    const normalizedOutputName = outputName.toLowerCase().endsWith(".pdf") ? outputName : `${outputName}.pdf`;

    const sidebar = (
        <Sidebar>
            <SidebarSection>
                <SidebarHeader>Output Settings</SidebarHeader>
                <SidebarContent>
                    <SidebarField label="Filename">
                        <Input
                            className="h-7 px-2 rounded-[4px] bg-[#111] border-[#282828] text-[12px] text-white focus-visible:ring-1 focus-visible:ring-[#eb5a3f] shadow-inner"
                            value={outputName}
                            onChange={(event) => setOutputName(event.currentTarget.value)}
                        />
                    </SidebarField>
                </SidebarContent>
            </SidebarSection>

            <SidebarInfo>Files are merged in the order shown. Use the arrow buttons to reorder before processing.</SidebarInfo>

            <SidebarFooter>
                <SidebarStat label="Files" value={files.length || "-"} isHighlight={files.length > 1} />
                <SidebarStat label="Input Size" value={files.length > 0 ? formatBytes(totalInputBytes) : "-"} />
                <SidebarStat label="Output Size" value={mergedData ? formatBytes(mergedData.byteLength) : "-"} isHighlight={Boolean(mergedData)} />
            </SidebarFooter>
        </Sidebar>
    );

    const visual = (
        <>
            <div className="absolute w-16 h-20 bg-linear-to-br from-[#1a1a1a] to-[#111] rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] border border-[#333] -rotate-12 -translate-x-3 translate-y-1 transition-all duration-500 group-hover:rotate-[-15deg] group-hover:-translate-x-5" />
            <div className="absolute w-16 h-20 bg-linear-to-br from-[#222] to-[#1a1a1a] rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] border border-[#444] rotate-6 translate-x-3 translate-y-1 transition-all duration-500 group-hover:rotate-12 group-hover:translate-x-5" />
            <div className="absolute w-16 h-20 bg-linear-to-br from-[#eb5a3f] to-[#b33e29] rounded-xl shadow-[0_10px_20px_rgba(235,90,63,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-[#ff7b63] flex flex-col items-center justify-center z-10 transition-transform duration-500 group-hover:scale-105">
                <RiStackLine className="size-6 text-white/90 drop-shadow-md" />
                <div className="absolute top-0 right-0 w-4 h-4 bg-linear-to-bl from-white/40 to-transparent rounded-bl-lg shadow-sm" />
            </div>
        </>
    );

    const mediaPanel =
        files.length > 0 ? (
            <div className="flex h-full flex-col gap-3 overflow-hidden p-3">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Queue</span>
                    <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
                        Add PDFs
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <FilesList files={files} onMove={handleMove} onRemove={handleRemove} />
                </div>
                <ToolStatusLine status={status} />
                {mergedData && (
                    <MetricGrid
                        metrics={[
                            { label: "Files", value: files.length, tone: "accent" },
                            { label: "Output", value: formatBytes(mergedData.byteLength), tone: "accent" },
                            { label: "Time", value: elapsedMs === null ? "-" : formatDuration(elapsedMs) },
                            { label: "Throughput", value: elapsedMs === null ? "-" : formatThroughput(totalInputBytes, elapsedMs) },
                        ]}
                    />
                )}
                <input
                    ref={inputRef}
                    hidden
                    multiple
                    accept="application/pdf,.pdf"
                    type="file"
                    onChange={(event) => {
                        handleFiles(Array.from(event.currentTarget.files ?? []));
                        event.currentTarget.value = "";
                    }}
                />
            </div>
        ) : undefined;

    const footerSlot = mergedData ? (
        <Button className="h-8 w-full rounded-[4px] text-[12px] font-medium" variant="secondary" onClick={() => downloadPdf(mergedData, normalizedOutputName)}>
            Download Merged PDF
        </Button>
    ) : null;

    const centerContent =
        files.length > 0 ? (
            <PdfPreview data={mergedData ?? undefined} file={!mergedData && files[0] ? files[0] : undefined} />
        ) : (
            <EmptyState
                accept="application/pdf,.pdf"
                badgeIcon={<RiAddLine className="size-5" />}
                description="Select multiple PDFs to merge into one."
                inputRef={inputRef}
                isMultiple
                onFiles={handleFiles}
                title="Drop PDFs to merge"
                visual={visual}
            />
        );

    return (
        <ToolLayout
            actionText={files.length > 0 ? "Merge PDFs" : "Select PDFs"}
            footerSlot={footerSlot}
            isActionBusy={isWorking}
            mediaPanel={mediaPanel}
            onAction={handleMerge}
            sidebar={sidebar}
            title="Merge"
        >
            {centerContent}
        </ToolLayout>
    );
}
