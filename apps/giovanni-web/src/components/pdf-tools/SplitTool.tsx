import { splitPages } from "@pdfly/wasm";
import * as React from "react";
import { RiAddLine, RiScissorsCutLine } from "@remixicon/react";
import { ToolLayout } from "../ToolLayout";
import { EmptyState } from "../empty-state/EmptyState";
import { Button } from "../shadcn-ui/Button";
import { Input } from "../shadcn-ui/Input";
import { Sidebar, SidebarContent, SidebarField, SidebarFooter, SidebarHeader, SidebarInfo, SidebarSection, SidebarStat } from "../sidebar";
import { downloadPdf, downloadZip, formatDuration, formatThroughput, isPdfFile, pdfBaseName } from "../../lib/pdf-tools/utils";
import { FileSummary, MetricGrid, ToolStatus, ToolStatusLine, ToolWorkspace } from "./PdfToolComponents";

export function SplitTool() {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [file, setFile] = React.useState<File | null>(null);
    const [pages, setPages] = React.useState<Uint8Array[]>([]);
    const [elapsedMs, setElapsedMs] = React.useState<number | null>(null);
    const [status, setStatus] = React.useState<ToolStatus>(null);
    const [isWorking, setIsWorking] = React.useState(false);
    const [outputPattern, setOutputPattern] = React.useState("{basename}_page_{page}");

    const handleFiles = (files: File[]) => {
        const nextFile = files.find(isPdfFile);
        if (!nextFile) {
            setStatus({ tone: "error", message: "Please select a PDF file." });
            return;
        }

        setFile(nextFile);
        setPages([]);
        setElapsedMs(null);
        setStatus({ tone: "info", message: "PDF loaded. Split it into one file per page." });
    };

    const handleSplit = async () => {
        if (!file) {
            inputRef.current?.click();
            return;
        }

        setIsWorking(true);
        setStatus({ tone: "info", message: "Splitting pages locally..." });

        try {
            const arrayBuffer = await file.arrayBuffer();
            const start = performance.now();
            const result = await splitPages(arrayBuffer);
            const nextElapsedMs = performance.now() - start;

            setPages(result.pages);
            setElapsedMs(nextElapsedMs);
            setStatus({ tone: "success", message: `Extracted ${result.pageCount} ${result.pageCount === 1 ? "page" : "pages"}.` });
        } catch (error) {
            setPages([]);
            setElapsedMs(null);
            setStatus({ tone: "error", message: error instanceof Error ? error.message : "Failed to split PDF." });
        } finally {
            setIsWorking(false);
        }
    };

    const makePageName = (pageIndex: number) =>
        outputPattern
            .replaceAll("{basename}", pdfBaseName(file))
            .replaceAll("{page}", String(pageIndex + 1))
            .replace(/\.pdf$/i, "")
            .concat(".pdf");

    const handleDownloadAll = async () => {
        if (pages.length === 0) {
            return;
        }

        const entries: Record<string, Uint8Array> = {};
        pages.forEach((page, index) => {
            entries[makePageName(index)] = page;
        });

        try {
            await downloadZip(entries, `${pdfBaseName(file)}_pages.zip`, 0);
        } catch (error) {
            setStatus({ tone: "error", message: error instanceof Error ? error.message : "Could not create ZIP." });
        }
    };

    const sidebar = (
        <Sidebar>
            <SidebarSection>
                <SidebarHeader>Split Settings</SidebarHeader>
                <SidebarContent>
                    <SidebarField label="Mode">
                        <div className="flex h-7 items-center rounded-[4px] border border-[#282828] bg-[#111] px-2 text-[12px] leading-none text-neutral-300 shadow-inner">
                            All pages
                        </div>
                    </SidebarField>
                </SidebarContent>
            </SidebarSection>

            <SidebarSection>
                <SidebarHeader>Output</SidebarHeader>
                <SidebarContent>
                    <SidebarField label="Pattern">
                        <Input
                            className="h-7 px-2 rounded-[4px] bg-[#111] border-[#282828] text-[12px] text-white focus-visible:ring-1 focus-visible:ring-[#eb5a3f] shadow-inner"
                            value={outputPattern}
                            onChange={(event) => setOutputPattern(event.currentTarget.value)}
                        />
                    </SidebarField>
                </SidebarContent>
            </SidebarSection>

            <SidebarInfo>Select a PDF file to extract every page as a separate PDF.</SidebarInfo>

            <SidebarFooter>
                <SidebarStat label="Source Size" value={file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "-"} />
                <SidebarStat label="Pages" value={pages.length || "-"} isHighlight={pages.length > 0} />
            </SidebarFooter>
        </Sidebar>
    );

    const visual = (
        <div className="absolute inset-0 flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-500">
            <div className="relative w-16 h-20">
                <div className="absolute top-0 left-0 right-0 h-[38px] bg-linear-to-b from-[#2a2a2a] to-[#222] rounded-t-xl shadow-[0_5px_10px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)] border border-[#444] border-b-dashed transition-transform duration-500 group-hover:-translate-y-3 group-hover:-rotate-3 origin-bottom z-10 overflow-hidden">
                    <div className="absolute top-0 right-0 w-4 h-4 bg-linear-to-bl from-white/20 to-transparent rounded-bl-sm shadow-sm" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-[38px] bg-linear-to-t from-[#2a2a2a] to-[#222] rounded-b-xl shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_-1px_1px_rgba(255,255,255,0.1)] border border-[#444] border-t-0 transition-transform duration-500 group-hover:translate-y-3 group-hover:rotate-3 origin-top z-10" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#eb5a3f] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-125 z-20">
                    <RiScissorsCutLine className="size-6" />
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        if (!file) {
            return (
                <EmptyState
                    accept="application/pdf,.pdf"
                    badgeIcon={<RiAddLine className="size-5" />}
                    description="Each page becomes a downloadable PDF."
                    inputRef={inputRef}
                    onFiles={handleFiles}
                    title="Drop a PDF to split"
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
                        <Button disabled={pages.length === 0} size="sm" onClick={handleDownloadAll}>
                            Download ZIP
                        </Button>
                    </>
                }
                description="Output files are generated from qpdf page splits."
                title="Page Extraction"
            >
                <input ref={inputRef} hidden accept="application/pdf,.pdf" type="file" onChange={(event) => handleFiles(Array.from(event.currentTarget.files ?? []))} />
                <FileSummary file={file} />
                <ToolStatusLine status={status} />
                {pages.length > 0 && (
                    <>
                        <MetricGrid
                            metrics={[
                                { label: "Pages", value: pages.length, tone: "accent" },
                                { label: "Time", value: elapsedMs === null ? "-" : formatDuration(elapsedMs) },
                                { label: "Throughput", value: elapsedMs === null ? "-" : formatThroughput(file.size, elapsedMs) },
                            ]}
                        />
                        <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                            {pages.map((page, index) => (
                                <div
                                    key={`${makePageName(index)}-${index}`}
                                    className="flex items-center justify-between gap-3 rounded-[6px] border border-[#2a2a2a] bg-[#101010] px-3 py-2"
                                >
                                    <div className="min-w-0">
                                        <div className="truncate text-[12px] font-medium text-neutral-100">{makePageName(index)}</div>
                                        <div className="text-[11px] text-neutral-500">Page {index + 1}</div>
                                    </div>
                                    <Button size="sm" variant="secondary" onClick={() => downloadPdf(page, makePageName(index))}>
                                        Download
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
        <ToolLayout isActionBusy={isWorking} actionText={file ? "Split Pages" : "Select PDF"} onAction={handleSplit} sidebar={sidebar} title="Split Pages">
            {renderContent()}
        </ToolLayout>
    );
}
