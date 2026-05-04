import { formatBytes, mergePdfs } from "@pdfly/wasm";
import { RiAddLine } from "@remixicon/react";
import * as React from "react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { BeforeAfterView } from "@/components/BeforeAfterView";
import { EmptyState } from "@/components/emptyState/EmptyState";
import { Button } from "@/components/ui/shadcn/Button";
import { Sidebar, SidebarContent, SidebarField, SidebarHeader, SidebarInput, SidebarSection } from "@/components/sidebar";
import { useAsyncToolJob } from "@/lib/features/pdfTools/hooks/useAsyncToolJob";
import { downloadPdf, ensurePdfExtension, filterPdfFiles } from "@/lib/features/pdfTools/utils/pdfToolUtils";
import { MergeVisual } from "@/components/pdfTools/visuals/PdfToolVisuals";
import { FilesList } from "@/components/pdfTools/FilesList";
import { PdfPreview } from "@/components/pdfTools/PdfPreview";
import { ToolResultTray } from "@/components/pdfTools/ToolResultTray";

export function MergeTool() {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [files, setFiles] = React.useState<File[]>([]);
    const [outputName, setOutputName] = React.useState("merged.pdf");
    const { result: mergedData, status, isWorking, setStatus, setResult, clearResult, runJob } = useAsyncToolJob<Uint8Array>();

    const totalInputBytes = files.reduce((sum, file) => sum + file.size, 0);

    const processFiles = React.useCallback(
        async (nextFiles: File[]) => {
            if (nextFiles.length < 2) {
                clearResult();
                return;
            }

            await runJob({
                execute: async () => {
                    const buffers = await Promise.all(nextFiles.map((file) => file.arrayBuffer()));
                    const result = await mergePdfs(buffers);

                    return result.data;
                },
                errorMessage: "Failed to merge PDFs.",
                successStatus: () => ({ tone: "success", message: `Merged ${nextFiles.length} PDFs.` }),
            });
        },
        [clearResult, runJob],
    );

    const handleFiles = React.useCallback(
        (nextFiles: File[]) => {
            const pdfs = filterPdfFiles(nextFiles);

            if (pdfs.length === 0) {
                setStatus({ tone: "error", message: "Please select PDF files only." });
                return;
            }

            setFiles((current) => {
                const mergedFiles = [...current, ...pdfs];
                void processFiles(mergedFiles);

                return mergedFiles;
            });
        },
        [processFiles, setStatus],
    );

    const handleRemove = (index: number) => {
        setFiles((current) => {
            const next = current.filter((_, currentIndex) => currentIndex !== index);
            void processFiles(next);

            return next;
        });
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

            setResult(null);
            void processFiles(next);

            return next;
        });
    };

    const normalizedOutputName = ensurePdfExtension(outputName);

    const sidebar = (
        <Sidebar>
            <SidebarSection>
                <SidebarHeader>Output Settings</SidebarHeader>
                <SidebarContent>
                    <SidebarField label="Filename">
                        <SidebarInput value={outputName} onChange={(event) => setOutputName(event.currentTarget.value)} />
                    </SidebarField>
                </SidebarContent>
            </SidebarSection>
        </Sidebar>
    );

    const beforeContent =
        files.length > 0 ? (
            <div className="flex h-full flex-col overflow-hidden">
                <div className="flex shrink-0 items-center justify-between border-b border-app-border-subtle px-4 py-2">
                    <span className="text-[11px] font-medium text-neutral-500">
                        {files.length} {files.length === 1 ? "file" : "files"}
                    </span>
                    <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
                        Add PDFs
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 pb-24">
                    <FilesList files={files} onMove={handleMove} onRemove={handleRemove} />
                </div>
            </div>
        ) : null;

    const afterContent =
        files.length < 2 ? (
            <div className="flex h-full items-center justify-center">
                <span className="text-[12px] text-neutral-700">Add at least 2 PDFs to merge</span>
            </div>
        ) : mergedData ? (
            <PdfPreview data={mergedData} />
        ) : undefined;

    const centerContent =
        files.length > 0 ? (
            <div className="relative h-full w-full">
                <BeforeAfterView after={afterContent} before={beforeContent} isProcessing={isWorking && files.length >= 2} />
                <ToolResultTray
                    fileName={`${files.length} ${files.length === 1 ? "PDF" : "PDFs"} selected`}
                    fileSize={formatBytes(totalInputBytes)}
                    metrics={[
                        { label: "Files", value: files.length, tone: files.length > 1 ? "accent" : "neutral" },
                        ...(mergedData ? [{ label: "Output", value: formatBytes(mergedData.byteLength) }] : []),
                    ]}
                    primaryAction={mergedData ? { label: "Download PDF", onClick: () => downloadPdf(mergedData, normalizedOutputName) } : undefined}
                    secondaryActions={[{ label: "Add PDFs", onClick: () => inputRef.current?.click() }]}
                    status={isWorking ? { tone: "info", message: "Merging PDFs..." } : status}
                />
            </div>
        ) : (
            <EmptyState
                accept="application/pdf,.pdf"
                badgeIcon={<RiAddLine className="size-5" />}
                description="Select multiple PDFs to merge into one."
                inputRef={inputRef}
                isMultiple
                onFiles={handleFiles}
                title="Drop PDFs to merge"
                visual={<MergeVisual />}
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
            <ToolLayout isMultiple onFiles={handleFiles} sidebar={sidebar} title="Merge">
                {centerContent}
            </ToolLayout>
        </>
    );
}
