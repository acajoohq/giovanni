import { splitPages } from "@pdfly/wasm";
import * as React from "react";
import { RiAddLine, RiScissorsCutLine } from "@remixicon/react";
import { ToolLayout } from "../ToolLayout";
import { BeforeAfterView } from "../BeforeAfterView";
import { EmptyState } from "../empty-state/EmptyState";
import { Button } from "../shadcn-ui/Button";
import { Input } from "../shadcn-ui/Input";
import { Sidebar, SidebarContent, SidebarField, SidebarFooter, SidebarHeader, SidebarSection, SidebarStat } from "../sidebar";
import { FileSummary } from "./FileSummary";
import { MetricGrid } from "./MetricGrid";
import { type ToolStatus, ToolStatusLine } from "./ToolStatusLine";
import { downloadPdf, downloadZip, formatDuration, formatThroughput, isPdfFile, pdfBaseName } from "../../lib/pdf-tools/utils";
import { PdfPreview } from "./PdfPreview";

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
        setStatus(null);
    };

    React.useEffect(() => {
        if (!file) return;
        let cancelled = false;

        const run = async () => {
            setIsWorking(true);
            setPages([]);
            setElapsedMs(null);

            try {
                const buffer = await file.arrayBuffer();
                if (cancelled) return;
                const start = performance.now();
                const result = await splitPages(buffer);
                if (cancelled) return;
                setPages(result.pages);
                setElapsedMs(performance.now() - start);
                setStatus({ tone: "success", message: `Extracted ${result.pageCount} ${result.pageCount === 1 ? "page" : "pages"}.` });
            } catch (error) {
                if (!cancelled) setStatus({ tone: "error", message: error instanceof Error ? error.message : "Failed to split PDF." });
            } finally {
                if (!cancelled) setIsWorking(false);
            }
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [file]); // eslint-disable-line react-hooks/exhaustive-deps

    const makePageName = (pageIndex: number) =>
        outputPattern
            .replaceAll("{basename}", pdfBaseName(file))
            .replaceAll("{page}", String(pageIndex + 1))
            .replace(/\.pdf$/i, "")
            .concat(".pdf");

    const handleDownloadAll = async () => {
        if (pages.length === 0 || !file) return;
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
                <SidebarHeader>Split Settings</SidebarHeader>
                <SidebarContent>
                    <SidebarField label="Mode">
                        <div className="flex h-7 items-center rounded-[4px] border border-[#282828] bg-[#111] px-2 text-[12px] leading-none text-neutral-300 shadow-inner">
                            All pages
                        </div>
                    </SidebarField>
                    <SidebarField label="Pattern">
                        <Input
                            className="h-7 rounded-[4px] border-[#282828] bg-[#111] px-2 text-[12px] text-white shadow-inner focus-visible:ring-1 focus-visible:ring-[#eb5a3f]"
                            value={outputPattern}
                            onChange={(event) => setOutputPattern(event.currentTarget.value)}
                        />
                    </SidebarField>
                </SidebarContent>
            </SidebarSection>

            {pages.length > 0 && elapsedMs !== null && file && (
                <SidebarSection>
                    <SidebarContent>
                        <MetricGrid
                            metrics={[
                                { label: "Pages", value: pages.length, tone: "accent" },
                                { label: "Time", value: formatDuration(elapsedMs) },
                                { label: "Throughput", value: formatThroughput(file.size, elapsedMs) },
                            ]}
                        />
                    </SidebarContent>
                </SidebarSection>
            )}

            <SidebarFooter>
                <SidebarStat label="Source Size" value={file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "-"} />
                <SidebarStat isHighlight={pages.length > 0} label="Pages" value={pages.length || "-"} />
            </SidebarFooter>
        </Sidebar>
    );

    const visual = (
        <div className="absolute inset-0 flex items-center justify-center transition-transform duration-500 group-hover:rotate-6">
            <div className="relative h-20 w-16">
                <div className="absolute left-0 right-0 top-0 z-10 h-[38px] origin-bottom overflow-hidden rounded-t-xl border border-[#444] border-b-dashed bg-linear-to-b from-[#2a2a2a] to-[#222] shadow-[0_5px_10px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)] transition-transform duration-500 group-hover:-translate-y-3 group-hover:-rotate-3">
                    <div className="absolute right-0 top-0 h-4 w-4 rounded-bl-sm bg-linear-to-bl from-white/20 to-transparent shadow-sm" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 z-10 h-[38px] origin-top rounded-b-xl border border-[#444] border-t-0 bg-linear-to-t from-[#2a2a2a] to-[#222] shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_-1px_1px_rgba(255,255,255,0.1)] transition-transform duration-500 group-hover:translate-y-3 group-hover:rotate-3" />
                <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 text-[#eb5a3f] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-125">
                    <RiScissorsCutLine className="size-6" />
                </div>
            </div>
        </div>
    );

    const pagesOutput = pages.length > 0 && file && (
        <div className="h-full w-full overflow-y-auto p-3">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                {pages.map((page, index) => (
                    <div key={index} className="flex flex-col gap-1.5">
                        <div className="aspect-3/4 overflow-hidden rounded-md border border-[#2a2a2a] bg-[#0a0a0a]">
                            <PdfPreview data={page} />
                        </div>
                        <span className="truncate text-center text-[10px] text-neutral-500">Page {index + 1}</span>
                        <Button className="h-6 text-[10px]" size="sm" variant="secondary" onClick={() => downloadPdf(page, makePageName(index))}>
                            Download
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );

    const footerSlot = file && (
        <Button className="h-8 w-full rounded-[4px] text-[12px] font-medium" disabled={pages.length === 0} variant="secondary" onClick={handleDownloadAll}>
            Download ZIP
        </Button>
    );

    const centerContent = file ? (
        <BeforeAfterView after={pagesOutput} before={<PdfPreview file={file} />} isProcessing={isWorking} />
    ) : (
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

    return (
        <>
            <input ref={inputRef} hidden accept="application/pdf,.pdf" type="file" onChange={(event) => handleFiles(Array.from(event.currentTarget.files ?? []))} />
            <ToolLayout
                actionText={file ? "Re-split" : "Select PDF"}
                footerSlot={footerSlot}
                isActionBusy={isWorking}
                isActionDisabled={!file}
                onAction={() => {
                    if (!file) inputRef.current?.click();
                }}
                onFiles={handleFiles}
                sidebar={sidebar}
                title="Split Pages"
            >
                {centerContent}
            </ToolLayout>
        </>
    );
}
