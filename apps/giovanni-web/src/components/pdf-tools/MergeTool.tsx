import { formatBytes, mergePdfs } from "@pdfly/wasm";
import * as React from "react";
import { RiAddLine, RiStackLine } from "@remixicon/react";
import { ToolLayout } from "../ToolLayout";
import { BeforeAfterView } from "../BeforeAfterView";
import { EmptyState } from "../empty-state/EmptyState";
import { Button } from "../shadcn-ui/Button";
import { Input } from "../shadcn-ui/Input";
import { Sidebar, SidebarContent, SidebarField, SidebarFooter, SidebarHeader, SidebarSection, SidebarStat } from "../sidebar";
import { FilesList } from "./FilesList";
import { type ToolStatus, ToolStatusLine } from "./ToolStatusLine";
import { downloadPdf, isPdfFile } from "../../lib/pdf-tools/utils";
import { PdfPreview } from "./PdfPreview";

export function MergeTool() {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [files, setFiles] = React.useState<File[]>([]);
    const [outputName, setOutputName] = React.useState("merged.pdf");
    const [mergedData, setMergedData] = React.useState<Uint8Array | null>(null);
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
        setStatus(null);
    };

    const handleRemove = (index: number) => {
        setFiles((current) => current.filter((_, i) => i !== index));
        setMergedData(null);
    };

    const handleMove = (index: number, direction: -1 | 1) => {
        setFiles((current) => {
            const target = index + direction;
            if (target < 0 || target >= current.length) return current;
            const next = [...current];
            const [file] = next.splice(index, 1);
            if (file) next.splice(target, 0, file);
            return next;
        });
        setMergedData(null);
    };

    React.useEffect(() => {
        if (files.length < 2) {
            setMergedData(null);
            return;
        }
        let cancelled = false;

        const run = async () => {
            setIsWorking(true);
            setMergedData(null);

            try {
                const buffers = await Promise.all(files.map((f) => f.arrayBuffer()));
                if (cancelled) return;
                const result = await mergePdfs(buffers);
                if (cancelled) return;
                setMergedData(result.data);
                setStatus({ tone: "success", message: `Merged ${result.sourceCount} PDFs.` });
            } catch (error) {
                if (!cancelled) setStatus({ tone: "error", message: error instanceof Error ? error.message : "Failed to merge PDFs." });
            } finally {
                if (!cancelled) setIsWorking(false);
            }
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [files]);

    const normalizedOutputName = outputName.toLowerCase().endsWith(".pdf") ? outputName : `${outputName}.pdf`;

    const sidebar = (
        <Sidebar>
            {status && (
                <SidebarSection>
                    <SidebarContent>
                        <ToolStatusLine status={status} />
                    </SidebarContent>
                </SidebarSection>
            )}

            <SidebarSection>
                <SidebarHeader>Output Settings</SidebarHeader>
                <SidebarContent>
                    <SidebarField label="Filename">
                        <Input
                            className="h-7 rounded-[4px] border-[#282828] bg-[#111] px-2 text-[12px] text-white shadow-inner focus-visible:ring-1 focus-visible:ring-[#eb5a3f]"
                            value={outputName}
                            onChange={(event) => setOutputName(event.currentTarget.value)}
                        />
                    </SidebarField>
                </SidebarContent>
            </SidebarSection>

            <SidebarFooter>
                <SidebarStat isHighlight={files.length > 1} label="Files" value={files.length || "-"} />
                <SidebarStat label="Input Size" value={files.length > 0 ? formatBytes(totalInputBytes) : "-"} />
                <SidebarStat isHighlight={Boolean(mergedData)} label="Output Size" value={mergedData ? formatBytes(mergedData.byteLength) : "-"} />
            </SidebarFooter>
        </Sidebar>
    );

    const visual = (
        <>
            <div className="absolute h-20 w-16 -translate-x-3 translate-y-1 -rotate-12 rounded-xl border border-[#333] bg-linear-to-br from-[#1a1a1a] to-[#111] shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all duration-500 group-hover:-translate-x-5 group-hover:rotate-[-15deg]" />
            <div className="absolute h-20 w-16 translate-x-3 translate-y-1 rotate-6 rounded-xl border border-[#444] bg-linear-to-br from-[#222] to-[#1a1a1a] shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all duration-500 group-hover:translate-x-5 group-hover:rotate-12" />
            <div className="absolute z-10 flex h-20 w-16 flex-col items-center justify-center rounded-xl border border-[#ff7b63] bg-linear-to-br from-[#eb5a3f] to-[#b33e29] shadow-[0_10px_20px_rgba(235,90,63,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] transition-transform duration-500 group-hover:scale-105">
                <RiStackLine className="size-6 text-white/90 drop-shadow-md" />
                <div className="absolute right-0 top-0 h-4 w-4 rounded-bl-lg bg-linear-to-bl from-white/40 to-transparent shadow-sm" />
            </div>
        </>
    );

    const beforeContent = files.length > 0 ? (
        <div className="flex h-full flex-col overflow-hidden">
            <div className="flex shrink-0 items-center justify-between border-b border-[#1f1f1f] px-4 py-2">
                <span className="text-[11px] font-medium text-neutral-500">
                    {files.length} {files.length === 1 ? "file" : "files"}
                </span>
                <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
                    Add PDFs
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
                <FilesList files={files} onMove={handleMove} onRemove={handleRemove} />
            </div>
        </div>
    ) : null;

    const afterContent = files.length < 2 ? (
        <div className="flex h-full items-center justify-center">
            <span className="text-[12px] text-neutral-700">Add at least 2 PDFs to merge</span>
        </div>
    ) : mergedData ? (
        <PdfPreview data={mergedData} />
    ) : undefined;

    const footerSlot = mergedData && (
        <Button className="h-8 w-full rounded-[4px] text-[12px] font-medium" variant="secondary" onClick={() => downloadPdf(mergedData, normalizedOutputName)}>
            Download Merged PDF
        </Button>
    );

    const centerContent =
        files.length > 0 ? (
            <BeforeAfterView after={afterContent} before={beforeContent} isProcessing={isWorking && files.length >= 2} />
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
        <>
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
            <ToolLayout
                actionText={files.length >= 2 ? "Re-merge" : "Select PDFs"}
                footerSlot={footerSlot}
                isActionBusy={isWorking}
                isActionDisabled={files.length < 2}
                isMultiple
                onAction={() => {
                    if (files.length === 0) inputRef.current?.click();
                }}
                onFiles={handleFiles}
                sidebar={sidebar}
                title="Merge"
            >
                {centerContent}
            </ToolLayout>
        </>
    );
}
