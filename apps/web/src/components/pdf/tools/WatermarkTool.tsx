import { formatBytes, inspectPdf, watermarkPdf, watermarkTextPdf, type WatermarkPlacement, type WatermarkResult, type WatermarkTextPattern } from "@acajoo/giovanni-core";
import { RiAddLine } from "@remixicon/react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/emptyState/EmptyState";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { ResultTray } from "@/components/pdf/ResultTray";
import { PdfPreview } from "@/components/pdf/PdfPreview";
import { Button } from "@/components/ui/shadcn/Button";
import {
    Sidebar,
    SidebarContent,
    SidebarField,
    SidebarHeader,
    SidebarInput,
    SidebarReadonlyValue,
    SidebarSection,
    SidebarSelect,
    SidebarToggle,
    SidebarToggleGroup,
} from "@/components/sidebar";
import { BeforeAfterView } from "@/components/viewer/BeforeAfterView";
import { useAsyncToolJob } from "@/hooks/useAsyncToolJob";
import { usePendingFileHandler } from "@/hooks/usePendingFileHandler";
import { downloadPdf, ensurePdfExtension, findFirstPdfFile, formatDuration, isPdfFile, pdfBaseName } from "@/utils/pdfTool.utils";
import { createImageWatermarkPdf, isImageWatermarkFile } from "@/utils/watermarkTemplate.utils";

type WatermarkSourceMode = "default" | "custom";
type WatermarkPageTargetMode = "all" | "custom";

const FONT_SIZE_OPTIONS = [
    { label: "32pt", value: "32" },
    { label: "48pt", value: "48" },
    { label: "64pt", value: "64" },
    { label: "80pt", value: "80" },
    { label: "96pt", value: "96" },
    { label: "128pt", value: "128" },
];

const OPACITY_OPTIONS = [
    { label: "5%", value: "0.05" },
    { label: "10%", value: "0.10" },
    { label: "15%", value: "0.15" },
    { label: "20%", value: "0.20" },
    { label: "30%", value: "0.30" },
    { label: "50%", value: "0.50" },
];

const ANGLE_OPTIONS = [
    { label: "0°", value: "0" },
    { label: "30°", value: "30" },
    { label: "45°", value: "45" },
    { label: "60°", value: "60" },
    { label: "90°", value: "90" },
];

function parseCustomPageSelection(value: string, pageCount: number): number[] {
    const rawTokens = value
        .split(",")
        .map((token) => token.trim())
        .filter((token) => token.length > 0);

    if (rawTokens.length === 0) {
        throw new Error("invalid");
    }

    const selectedPages = new Set<number>();

    for (const token of rawTokens) {
        if (token.includes("-")) {
            const rangeParts = token.split("-").map((part) => part.trim());
            if (rangeParts.length !== 2 || !rangeParts[0] || !rangeParts[1]) {
                throw new Error("invalid");
            }

            const start = Number(rangeParts[0]);
            const end = Number(rangeParts[1]);
            if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < 1 || start > end || end > pageCount) {
                throw new Error("invalid");
            }

            for (let page = start; page <= end; page += 1) {
                selectedPages.add(page - 1);
            }
            continue;
        }

        const page = Number(token);
        if (!Number.isInteger(page) || page < 1 || page > pageCount) {
            throw new Error("invalid");
        }
        selectedPages.add(page - 1);
    }

    return Array.from(selectedPages).sort((a, b) => a - b);
}

export function WatermarkTool() {
    const { t } = useTranslation();
    const sourceInputId = useId();
    const sourceInputRef = useRef<HTMLInputElement>(null);
    const watermarkInputRef = useRef<HTMLInputElement>(null);

    const [sourceFile, setSourceFile] = useState<File | null>(null);
    const [watermarkFile, setWatermarkFile] = useState<File | null>(null);
    const [watermarkSourceMode, setWatermarkSourceMode] = useState<WatermarkSourceMode>("default");
    const [defaultWatermarkText, setDefaultWatermarkText] = useState("CONFIDENTIAL");
    const [textFontSize, setTextFontSize] = useState("64");
    const [textOpacity, setTextOpacity] = useState("0.15");
    const [textAngle, setTextAngle] = useState("45");
    const [textPattern, setTextPattern] = useState<WatermarkTextPattern>("tile");
    const [outputName, setOutputName] = useState("watermarked.pdf");
    const [placement, setPlacement] = useState<WatermarkPlacement>("overlay");
    const [sourcePageCount, setSourcePageCount] = useState(0);
    const [pageTargetMode, setPageTargetMode] = useState<WatermarkPageTargetMode>("all");
    const [customPageSelection, setCustomPageSelection] = useState("1");

    const { result, elapsedMs, status, isWorking, setStatus, reset, clearResult, runJob } = useAsyncToolJob<WatermarkResult>();

    const handleSourceFiles = async (files: File[]) => {
        const nextFile = findFirstPdfFile(files);
        if (!nextFile) {
            setStatus({ tone: "error", message: t("common.selectPdf") });
            return;
        }

        try {
            const nextBuffer = await nextFile.arrayBuffer();
            const info = await inspectPdf(nextBuffer);

            reset();
            setSourceFile(nextFile);
            setSourcePageCount(info.numPages);
            setCustomPageSelection("1");
            setPageTargetMode("all");
        } catch (error) {
            setStatus({ tone: "error", message: error instanceof Error ? error.message : t("watermark.status.failedInspect") });
        }
    };

    usePendingFileHandler(handleSourceFiles);

    const handleWatermarkFiles = (files: File[]) => {
        const nextFile = files.find((file) => isPdfFile(file) || isImageWatermarkFile(file)) ?? null;
        if (!nextFile) {
            setStatus({ tone: "error", message: t("watermark.status.selectWatermark") });
            return;
        }

        reset();
        setWatermarkSourceMode("custom");
        setWatermarkFile(nextFile);
    };

    const resolveTargetPages = useCallback((): number[] | undefined => {
        if (sourcePageCount <= 0) {
            throw new Error(t("watermark.status.failedInspect"));
        }

        if (pageTargetMode === "all") {
            return undefined;
        }

        try {
            return parseCustomPageSelection(customPageSelection, sourcePageCount);
        } catch {
            throw new Error(t("watermark.status.invalidPages"));
        }
    }, [customPageSelection, pageTargetMode, sourcePageCount, t]);

    const runWatermark = useCallback(async () => {
        if (!sourceFile) {
            setStatus({ tone: "error", message: t("watermark.status.selectSource") });
            return;
        }

        if (watermarkSourceMode === "custom" && !watermarkFile) {
            clearResult();
            return;
        }

        let pages: number[] | undefined;
        try {
            pages = resolveTargetPages();
        } catch (error) {
            setStatus({ tone: "error", message: error instanceof Error ? error.message : t("watermark.status.invalidPages") });
            return;
        }

        await runJob({
            execute: async () => {
                const sourceBuffer = await sourceFile.arrayBuffer();

                if (watermarkSourceMode === "default") {
                    return watermarkTextPdf(sourceBuffer, {
                        text: defaultWatermarkText,
                        fontSize: Number(textFontSize),
                        opacity: Number(textOpacity),
                        angle: Number(textAngle),
                        pattern: textPattern,
                        placement,
                        pages,
                    });
                }

                let watermarkBuffer: Uint8Array | null = null;
                if (watermarkFile) {
                    watermarkBuffer = isPdfFile(watermarkFile) ? new Uint8Array(await watermarkFile.arrayBuffer()) : await createImageWatermarkPdf(watermarkFile);
                } else {
                    throw new Error(t("watermark.status.selectWatermark"));
                }

                return watermarkPdf(sourceBuffer, {
                    watermark: watermarkBuffer,
                    placement,
                    pages,
                });
            },
            errorMessage: t("watermark.status.failed"),
            successStatus: (nextResult) => ({
                tone: "success",
                message: t("watermark.status.applied", { count: nextResult.watermarkedPageCount }),
            }),
        });
    }, [
        clearResult,
        defaultWatermarkText,
        placement,
        runJob,
        setStatus,
        sourceFile,
        t,
        textAngle,
        textFontSize,
        textOpacity,
        textPattern,
        watermarkFile,
        watermarkSourceMode,
        resolveTargetPages,
    ]);

    useEffect(() => {
        if (!sourceFile) {
            return;
        }

        if (watermarkSourceMode === "custom" && !watermarkFile) {
            clearResult();
            return;
        }

        const timeoutId = window.setTimeout(() => {
            void runWatermark();
        }, 300);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [
        clearResult,
        customPageSelection,
        defaultWatermarkText,
        pageTargetMode,
        placement,
        runWatermark,
        sourceFile,
        textAngle,
        textFontSize,
        textOpacity,
        textPattern,
        watermarkFile,
        watermarkSourceMode,
    ]);

    const handleDownload = () => {
        if (!result || !sourceFile) {
            return;
        }

        const defaultName = `${pdfBaseName(sourceFile)}_watermarked.pdf`;
        const targetName = outputName.trim() ? outputName : defaultName;

        try {
            downloadPdf(result.data, ensurePdfExtension(targetName));
        } catch (error) {
            console.error("Failed to download watermarked PDF", error);
            setStatus({ tone: "error", message: error instanceof Error ? error.message : t("common.couldNotDownload") });
        }
    };

    const sidebar = (
        <Sidebar>
            <SidebarSection>
                <SidebarHeader>{t("watermark.sidebar.files")}</SidebarHeader>
                <SidebarContent>
                    <SidebarField label={t("watermark.sidebar.watermark")}>
                        <SidebarToggleGroup>
                            <SidebarToggle isActive={watermarkSourceMode === "default"} onClick={() => setWatermarkSourceMode("default")}>
                                {t("watermark.source.default")}
                            </SidebarToggle>
                            <SidebarToggle isActive={watermarkSourceMode === "custom"} onClick={() => setWatermarkSourceMode("custom")}>
                                {t("watermark.source.custom")}
                            </SidebarToggle>
                        </SidebarToggleGroup>
                    </SidebarField>
                    {watermarkSourceMode === "default" ? (
                        <>
                            <SidebarField label={t("watermark.sidebar.defaultText")}>
                                <SidebarInput value={defaultWatermarkText} onChange={(event) => setDefaultWatermarkText(event.currentTarget.value)} />
                            </SidebarField>
                            <SidebarField label={t("watermark.sidebar.fontSize")}>
                                <SidebarSelect options={FONT_SIZE_OPTIONS} value={textFontSize} onValueChange={setTextFontSize} />
                            </SidebarField>
                            <SidebarField label={t("watermark.sidebar.opacity")}>
                                <SidebarSelect options={OPACITY_OPTIONS} value={textOpacity} onValueChange={setTextOpacity} />
                            </SidebarField>
                            <SidebarField label={t("watermark.sidebar.angle")}>
                                <SidebarSelect options={ANGLE_OPTIONS} value={textAngle} onValueChange={setTextAngle} />
                            </SidebarField>
                            <SidebarField label={t("watermark.sidebar.pattern")}>
                                <SidebarToggleGroup>
                                    <SidebarToggle isActive={textPattern === "tile"} onClick={() => setTextPattern("tile")}>
                                        {t("watermark.pattern.tile")}
                                    </SidebarToggle>
                                    <SidebarToggle isActive={textPattern === "single"} onClick={() => setTextPattern("single")}>
                                        {t("watermark.pattern.single")}
                                    </SidebarToggle>
                                </SidebarToggleGroup>
                            </SidebarField>
                        </>
                    ) : (
                        <>
                            <SidebarField label={t("watermark.sidebar.watermark")}>
                                <Button size="sm" type="button" variant="secondary" onClick={() => watermarkInputRef.current?.click()}>
                                    {watermarkFile ? t("watermark.actions.replaceWatermark") : t("watermark.actions.selectWatermark")}
                                </Button>
                            </SidebarField>
                            <SidebarField label={t("watermark.sidebar.selectedWatermark")}>
                                <SidebarReadonlyValue>{watermarkFile?.name ?? t("watermark.sidebar.noWatermarkSelected")}</SidebarReadonlyValue>
                            </SidebarField>
                        </>
                    )}
                </SidebarContent>
            </SidebarSection>

            <SidebarSection>
                <SidebarHeader>{t("watermark.sidebar.settings")}</SidebarHeader>
                <SidebarContent>
                    <SidebarField label={t("watermark.sidebar.placement")}>
                        <SidebarToggleGroup>
                            <SidebarToggle isActive={placement === "overlay"} onClick={() => setPlacement("overlay")}>
                                {t("watermark.placement.overlay")}
                            </SidebarToggle>
                            <SidebarToggle isActive={placement === "underlay"} onClick={() => setPlacement("underlay")}>
                                {t("watermark.placement.underlay")}
                            </SidebarToggle>
                        </SidebarToggleGroup>
                    </SidebarField>
                    <SidebarField label={t("watermark.sidebar.pages")}>
                        <SidebarSelect
                            options={[
                                { label: t("watermark.pageTarget.all"), value: "all" },
                                { label: t("watermark.pageTarget.custom"), value: "custom" },
                            ]}
                            value={pageTargetMode}
                            onValueChange={(value) => setPageTargetMode(value as WatermarkPageTargetMode)}
                        />
                    </SidebarField>
                    {pageTargetMode === "custom" && sourcePageCount > 0 && (
                        <SidebarField label={t("watermark.sidebar.customPages")}>
                            <SidebarInput
                                placeholder={t("watermark.sidebar.customPagesPlaceholder")}
                                value={customPageSelection}
                                onChange={(event) => setCustomPageSelection(event.currentTarget.value)}
                            />
                        </SidebarField>
                    )}
                    <SidebarField label={t("common.sidebar.filename")}>
                        <SidebarInput value={outputName} onChange={(event) => setOutputName(event.currentTarget.value)} />
                    </SidebarField>
                </SidebarContent>
            </SidebarSection>
        </Sidebar>
    );

    const centerContent = sourceFile ? (
        <div className="relative h-full w-full">
            <BeforeAfterView after={result ? <PdfPreview data={result.data} /> : undefined} before={<PdfPreview file={sourceFile} />} isProcessing={isWorking} />
            <ResultTray
                fileName={sourceFile.name}
                fileSize={formatBytes(sourceFile.size)}
                metrics={[
                    ...(result ? [{ label: t("common.metrics.output"), value: formatBytes(result.data.byteLength) }] : []),
                    ...(result ? [{ label: t("common.metrics.pages"), value: result.pageCount }] : []),
                    ...(result ? [{ label: t("watermark.metrics.watermarked"), value: result.watermarkedPageCount, tone: "accent" as const }] : []),
                    ...(sourcePageCount > 0 ? [{ label: t("watermark.metrics.sourcePages"), value: sourcePageCount }] : []),
                    ...(elapsedMs !== null ? [{ label: t("common.metrics.time"), value: formatDuration(elapsedMs) }] : []),
                ]}
                primaryAction={result ? { label: t("common.downloadPdf"), onClick: handleDownload } : undefined}
                secondaryActions={[
                    { label: t("watermark.actions.replaceSource"), onClick: () => sourceInputRef.current?.click() },
                    ...(watermarkSourceMode === "custom" ? [{ label: t("watermark.actions.replaceWatermark"), onClick: () => watermarkInputRef.current?.click() }] : []),
                ]}
                status={isWorking ? { tone: "info", message: t("watermark.status.applying") } : status}
            />
        </div>
    ) : (
        <EmptyState
            badgeIcon={<RiAddLine className="size-5" />}
            description={t("watermark.emptyDescription")}
            fileInputId={sourceInputId}
            onFiles={handleSourceFiles}
            title={t("watermark.emptyTitle")}
            visual={<div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-app-border bg-app-panel text-[11px] text-app-text-subtle">PDF</div>}
        />
    );

    return (
        <>
            <input
                id={sourceInputId}
                ref={sourceInputRef}
                hidden
                accept="application/pdf,.pdf"
                type="file"
                onChange={(event) => {
                    void handleSourceFiles(Array.from(event.currentTarget.files ?? []));
                    event.currentTarget.value = "";
                }}
            />
            <input
                ref={watermarkInputRef}
                hidden
                accept="application/pdf,.pdf,image/png,.png,image/jpeg,.jpg,.jpeg"
                type="file"
                onChange={(event) => {
                    handleWatermarkFiles(Array.from(event.currentTarget.files ?? []));
                    event.currentTarget.value = "";
                }}
            />
            <ToolLayout onFiles={handleSourceFiles} sidebar={sidebar} title={t("watermark.toolTitle")}>
                {centerContent}
            </ToolLayout>
        </>
    );
}
