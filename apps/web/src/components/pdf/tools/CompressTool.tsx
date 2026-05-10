import { formatBytes, optimizePdf, OPTIMIZE_PRESETS, type DecodeLevel, type ObjectStreamMode, type OptimizeResult, type QpdfOptimizePreset, type WriteOptions } from "@pdfly/wasm";
import { RiAddLine, RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";
import { useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { ComparisonSlider } from "@/components/viewer/ComparisonSlider";
import { EmptyState } from "@/components/emptyState/EmptyState";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { SidebarCheckbox } from "@/components/sidebar/SidebarCheckbox";
import { SidebarContent } from "@/components/sidebar/SidebarContent";
import { SidebarField } from "@/components/sidebar/SidebarField";
import { SidebarHeader } from "@/components/sidebar/SidebarHeader";
import { SidebarRange, SidebarSelect } from "@/components/sidebar/SidebarControls";
import { SidebarSection } from "@/components/sidebar/SidebarSection";
import { SidebarToggle } from "@/components/sidebar/SidebarToggle";
import { SidebarToggleGroup } from "@/components/sidebar/SidebarToggleGroup";
import { EmptyCompress } from "@/components/pdf/emptyState/EmptyCompress";
import { PdfPreview } from "@/components/pdf/PdfPreview";
import { ResultTray } from "@/components/pdf/ResultTray";
import { PDF_WASM_SIDE_EFFECT_DEBOUNCE_MS } from "@/constants/pdfToolDebounce.constants";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { useAsyncToolJob } from "@/hooks/useAsyncToolJob";
import { downloadPdf, findFirstPdfFile, formatDuration, pdfBaseName } from "@/utils/pdfToolUtils.utils";

type OptimizeSettings = { preset: QpdfOptimizePreset } & Required<WriteOptions>;

export function CompressTool() {
    const { t } = useTranslation();

    const presetLabels: Record<QpdfOptimizePreset, string> = {
        default: t("compress.preset.default.label"),
        web: t("compress.preset.web.label"),
        archive: t("compress.preset.archive.label"),
    };

    const presetDescriptions: Record<QpdfOptimizePreset, string> = {
        default: t("compress.preset.default.description"),
        web: t("compress.preset.web.description"),
        archive: t("compress.preset.archive.description"),
    };
    const fileInputId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [previewPage, setPreviewPage] = useState(1);
    const [previewPageCount, setPreviewPageCount] = useState(0);
    const [settings, setSettings] = useState<OptimizeSettings>({ preset: "default", ...OPTIMIZE_PRESETS.default });
    const { result, elapsedMs, status, isWorking, setStatus, reset, runJob } = useAsyncToolJob<OptimizeResult>();

    const decodeLevelOptions: Array<{ label: string; value: DecodeLevel }> = [
        { label: t("compress.decodeLevel.none"), value: "none" },
        { label: t("compress.decodeLevel.generalized"), value: "generalized" },
        { label: t("compress.decodeLevel.specialized"), value: "specialized" },
        { label: t("compress.decodeLevel.all"), value: "all" },
    ];

    const objectStreamOptions: Array<{ label: string; value: ObjectStreamMode }> = [
        { label: t("compress.objectStreamMode.generate"), value: "generate" },
        { label: t("compress.objectStreamMode.preserve"), value: "preserve" },
        { label: t("compress.objectStreamMode.disable"), value: "disable" },
    ];

    const processFile = async (nextFile: File, options: OptimizeSettings = settings) => {
        await runJob({
            execute: async () => {
                const buffer = await nextFile.arrayBuffer();

                return optimizePdf(buffer, options);
            },
            errorMessage: t("compress.status.failed"),
            successStatus: (nextResult) =>
                nextResult.savedBytes >= 0
                    ? { tone: "success", message: t("compress.status.savedBytes", { bytes: formatBytes(nextResult.savedBytes) }) }
                    : { tone: "info", message: t("compress.status.slightlyLarger") },
        });
    };

    const debouncedProcessFile = useDebouncedCallback((nextFile: File, nextSettings: OptimizeSettings) => {
        void processFile(nextFile, nextSettings);
    }, PDF_WASM_SIDE_EFFECT_DEBOUNCE_MS);

    const scheduleRecompress = (nextSettings: OptimizeSettings) => {
        if (!file) {
            debouncedProcessFile.cancel();
            return;
        }

        debouncedProcessFile(file, nextSettings);
    };

    const updateSettings = (patch: Partial<OptimizeSettings>) => {
        const nextSettings = { ...settings, ...patch };
        setSettings(nextSettings);
        scheduleRecompress(nextSettings);
    };

    const selectPreset = (preset: QpdfOptimizePreset) => {
        updateSettings({ preset, ...OPTIMIZE_PRESETS[preset] });
    };

    const handleFiles = (files: File[]) => {
        const nextFile = findFirstPdfFile(files);

        if (!nextFile) {
            setStatus({ tone: "error", message: t("common.selectPdf") });
            return;
        }

        reset();
        debouncedProcessFile.cancel();
        setPreviewPage(1);
        setPreviewPageCount(0);
        setFile(nextFile);
        void processFile(nextFile);
    };

    const updatePreviewPage = (nextPage: number | ((currentPage: number) => number)) => {
        setPreviewPage((currentPage) => {
            const resolvedPage = typeof nextPage === "function" ? nextPage(currentPage) : nextPage;
            const maxPage = previewPageCount > 0 ? previewPageCount : 1;

            return Math.max(1, Math.min(maxPage, resolvedPage));
        });
    };

    const handleDownload = (data: Uint8Array, fileName: string) => {
        try {
            downloadPdf(data, fileName);
        } catch (error) {
            console.error("Failed to download compressed PDF", error);
            setStatus({ tone: "error", message: error instanceof Error ? error.message : t("common.couldNotDownload") });
        }
    };

    const sidebar = (
        <Sidebar>
            <SidebarSection>
                <SidebarHeader>{t("compress.preset.header")}</SidebarHeader>
                <SidebarContent>
                    <SidebarToggleGroup>
                        {(Object.keys(OPTIMIZE_PRESETS) as QpdfOptimizePreset[]).map((preset) => (
                            <SidebarToggle key={preset} isActive={settings.preset === preset} title={presetDescriptions[preset]} onClick={() => selectPreset(preset)}>
                                {presetLabels[preset]}
                            </SidebarToggle>
                        ))}
                    </SidebarToggleGroup>
                    <p className="mt-1.5 text-[11px] text-neutral-500">{presetDescriptions[settings.preset]}</p>
                </SidebarContent>
            </SidebarSection>

            <SidebarSection>
                <SidebarHeader>Advanced</SidebarHeader>
                <SidebarContent>
                    <SidebarField label={t("compress.sidebar.level")}>
                        <SidebarRange
                            max={9}
                            min={1}
                            value={settings.compressionLevel}
                            valueLabel={settings.compressionLevel}
                            onValueChange={(compressionLevel) => updateSettings({ compressionLevel })}
                        />
                    </SidebarField>
                    <SidebarField label={t("compress.sidebar.decode")}>
                        <SidebarSelect options={decodeLevelOptions} value={settings.decodeLevel} onValueChange={(decodeLevel) => updateSettings({ decodeLevel })} />
                    </SidebarField>
                    <SidebarField label={t("compress.sidebar.objectStreams")}>
                        <SidebarSelect options={objectStreamOptions} value={settings.objectStreams} onValueChange={(objectStreams) => updateSettings({ objectStreams })} />
                    </SidebarField>
                </SidebarContent>
            </SidebarSection>

            <SidebarSection>
                <SidebarHeader>{t("compress.sidebar.streamOptions")}</SidebarHeader>
                <SidebarContent>
                    <SidebarCheckbox checked={settings.linearize} label="Linearize" onChange={(event) => updateSettings({ linearize: event.currentTarget.checked })} />
                    <SidebarCheckbox
                        checked={settings.recompressFlate}
                        label={t("compress.sidebar.recompressFlate")}
                        onChange={(event) => updateSettings({ recompressFlate: event.currentTarget.checked })}
                    />
                    <SidebarCheckbox
                        checked={settings.compressPages}
                        label={t("compress.sidebar.compressPages")}
                        onChange={(event) => updateSettings({ compressPages: event.currentTarget.checked })}
                    />
                    <SidebarCheckbox
                        checked={settings.removeUnreferencedResources}
                        label={t("compress.sidebar.removeUnused")}
                        onChange={(event) => updateSettings({ removeUnreferencedResources: event.currentTarget.checked })}
                    />
                </SidebarContent>
            </SidebarSection>
        </Sidebar>
    );

    const centerContent = file ? (
        <div className="relative h-full w-full">
            <ComparisonSlider
                after={result ? <PdfPreview data={result.data} page={previewPage} showControls={false} onPageChange={updatePreviewPage} /> : undefined}
                before={<PdfPreview file={file} page={previewPage} showControls={false} onPageChange={updatePreviewPage} onPageCountChange={setPreviewPageCount} />}
                isProcessing={isWorking}
            />
            {previewPageCount > 1 && (
                <div className="absolute bottom-30 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-md border border-app-border bg-app-panel px-2 py-1 md:bottom-24">
                    <button
                        className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-app-control-hover hover:text-foreground disabled:opacity-30"
                        disabled={previewPage === 1}
                        type="button"
                        onClick={() => updatePreviewPage((currentPage) => currentPage - 1)}
                    >
                        <RiArrowLeftSLine className="size-4" />
                    </button>
                    <span className="min-w-[52px] text-center text-[11px] font-medium text-muted-foreground">
                        {previewPage} / {previewPageCount}
                    </span>
                    <button
                        className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-app-control-hover hover:text-foreground disabled:opacity-30"
                        disabled={previewPage === previewPageCount}
                        type="button"
                        onClick={() => updatePreviewPage((currentPage) => currentPage + 1)}
                    >
                        <RiArrowRightSLine className="size-4" />
                    </button>
                </div>
            )}
            <ResultTray
                fileName={file.name}
                fileSize={formatBytes(file.size)}
                metrics={
                    result
                        ? [
                              { label: t("compress.metrics.saved"), value: `${result.percentageSaved.toFixed(1)}%`, tone: "accent" },
                              { label: t("common.metrics.output"), value: formatBytes(result.compressedSize) },
                              { label: t("compress.preset.header"), value: presetLabels[result.preset] },
                              ...(elapsedMs !== null ? [{ label: t("common.metrics.time"), value: formatDuration(elapsedMs) }] : []),
                          ]
                        : []
                }
                primaryAction={
                    result
                        ? {
                              label: t("common.downloadPdf"),
                              onClick: () => handleDownload(result.data, `${pdfBaseName(file)}_compressed.pdf`),
                          }
                        : undefined
                }
                secondaryActions={[{ label: t("compress.actions.replace"), onClick: () => inputRef.current?.click() }]}
                status={isWorking ? { tone: "info", message: t("compress.status.compressing") } : status}
            />
        </div>
    ) : (
        <EmptyState
            badgeIcon={<RiAddLine className="size-5" />}
            description={t("compress.emptyDescription")}
            fileInputId={fileInputId}
            onFiles={handleFiles}
            title={t("compress.emptyTitle")}
            visual={<EmptyCompress />}
        />
    );

    return (
        <>
            <input
                id={fileInputId}
                ref={inputRef}
                hidden
                accept="application/pdf,.pdf"
                type="file"
                onChange={(event) => {
                    handleFiles(Array.from(event.currentTarget.files ?? []));
                    event.currentTarget.value = "";
                }}
            />
            <ToolLayout onFiles={handleFiles} sidebar={sidebar} title={t("compress.toolTitle")}>
                {centerContent}
            </ToolLayout>
        </>
    );
}
