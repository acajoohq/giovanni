import {
    compressPdf,
    formatBytes,
    OPTIMIZE_PRESETS,
    type CompressionEngine,
    type CompressResult,
    type DecodeLevel,
    type GhostscriptColorConversionStrategy,
    type GhostscriptCompatibilityLevel,
    type GhostscriptPdfSettings,
    type ObjectStreamMode,
    type QpdfOptimizePreset,
    type WriteOptions,
} from "@pdfly/wasm";
import { RiAddLine, RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";
import { useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/emptyState/EmptyState";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { EmptyCompress } from "@/components/pdf/emptyState/EmptyCompress";
import { PdfPreview } from "@/components/pdf/PdfPreview";
import { ResultTray } from "@/components/pdf/ResultTray";
import {
    Sidebar,
    SidebarCheckbox,
    SidebarCollapsibleSection,
    SidebarContent,
    SidebarField,
    SidebarHeader,
    SidebarInfo,
    SidebarRange,
    SidebarSection,
    SidebarSelect,
    SidebarToggle,
    SidebarToggleGroup,
} from "@/components/sidebar";
import { ComparisonSlider } from "@/components/viewer/ComparisonSlider";
import { PDF_WASM_SIDE_EFFECT_DEBOUNCE_MS } from "@/constants/pdfToolDebounce.constants";
import { useAsyncToolJob } from "@/hooks/useAsyncToolJob";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { downloadPdf, findFirstPdfFile, formatDuration, pdfBaseName } from "@/utils/pdfToolUtils.utils";

type QpdfSettings = { preset: QpdfOptimizePreset } & Required<WriteOptions>;
type GhostscriptSettings = {
    preset: GhostscriptPdfSettings;
    compatibilityLevel: GhostscriptCompatibilityLevel;
    colorConversionStrategy: GhostscriptColorConversionStrategy;
    downsampleColorImages: boolean;
    downsampleGrayImages: boolean;
    colorImageResolution: number;
    grayImageResolution: number;
    jpegQuality: number;
};

const QPDF_PRESETS: QpdfOptimizePreset[] = ["default", "web", "archive"];
const GHOSTSCRIPT_PRESETS: GhostscriptPdfSettings[] = ["default", "screen", "ebook", "printer", "prepress"];
const GHOSTSCRIPT_COMPATIBILITY_LEVELS: GhostscriptCompatibilityLevel[] = ["1.3", "1.4", "1.5", "1.6", "1.7"];
const DEFAULT_GHOSTSCRIPT_SETTINGS: GhostscriptSettings = {
    preset: "default",
    compatibilityLevel: "1.7",
    colorConversionStrategy: "LeaveColorUnchanged",
    downsampleColorImages: true,
    downsampleGrayImages: true,
    colorImageResolution: 144,
    grayImageResolution: 144,
    jpegQuality: 75,
};

export function CompressTool() {
    const { t } = useTranslation();
    const fileInputId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [sourceData, setSourceData] = useState<Uint8Array | null>(null);
    const [previewPage, setPreviewPage] = useState(1);
    const [previewPageCount, setPreviewPageCount] = useState(0);
    const [engine, setEngine] = useState<CompressionEngine>("qpdf");
    const [qpdfSettings, setQpdfSettings] = useState<QpdfSettings>({ preset: "default", ...OPTIMIZE_PRESETS.default });
    const [ghostscriptSettings, setGhostscriptSettings] = useState<GhostscriptSettings>(DEFAULT_GHOSTSCRIPT_SETTINGS);
    const { result, elapsedMs, status, isWorking, setStatus, reset, runJob } = useAsyncToolJob<CompressResult>();

    const engineLabels: Record<CompressionEngine, string> = {
        qpdf: t("compress.engine.qpdf.label"),
        ghostscript: t("compress.engine.ghostscript.label"),
    };

    const engineDescriptions: Record<CompressionEngine, string> = {
        qpdf: t("compress.engine.qpdf.description"),
        ghostscript: t("compress.engine.ghostscript.description"),
    };

    const qpdfPresetLabels: Record<QpdfOptimizePreset, string> = {
        default: t("compress.qpdfPreset.default.label"),
        web: t("compress.qpdfPreset.web.label"),
        archive: t("compress.qpdfPreset.archive.label"),
    };

    const qpdfPresetDescriptions: Record<QpdfOptimizePreset, string> = {
        default: t("compress.qpdfPreset.default.description"),
        web: t("compress.qpdfPreset.web.description"),
        archive: t("compress.qpdfPreset.archive.description"),
    };

    const ghostscriptPresetLabels: Record<GhostscriptPdfSettings, string> = {
        default: t("compress.ghostscriptPreset.default.label"),
        screen: t("compress.ghostscriptPreset.screen.label"),
        ebook: t("compress.ghostscriptPreset.ebook.label"),
        printer: t("compress.ghostscriptPreset.printer.label"),
        prepress: t("compress.ghostscriptPreset.prepress.label"),
    };

    const ghostscriptPresetDescriptions: Record<GhostscriptPdfSettings, string> = {
        default: t("compress.ghostscriptPreset.default.description"),
        screen: t("compress.ghostscriptPreset.screen.description"),
        ebook: t("compress.ghostscriptPreset.ebook.description"),
        printer: t("compress.ghostscriptPreset.printer.description"),
        prepress: t("compress.ghostscriptPreset.prepress.description"),
    };

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

    const ghostscriptCompatibilityOptions = GHOSTSCRIPT_COMPATIBILITY_LEVELS.map((value) => ({
        label: value,
        value,
    }));

    const ghostscriptColorStrategyOptions: Array<{ label: string; value: GhostscriptColorConversionStrategy }> = [
        { label: t("compress.colorStrategy.preserve"), value: "LeaveColorUnchanged" },
        { label: t("compress.colorStrategy.gray"), value: "Gray" },
        { label: t("compress.colorStrategy.rgb"), value: "RGB" },
        { label: t("compress.colorStrategy.cmyk"), value: "CMYK" },
        { label: t("compress.colorStrategy.deviceIndependent"), value: "UseDeviceIndependentColor" },
    ];

    const activePresetDescription =
        engine === "qpdf" ? qpdfPresetDescriptions[qpdfSettings.preset] : ghostscriptPresetDescriptions[ghostscriptSettings.preset];

    const buildCompressionOptions = (
        nextEngine: CompressionEngine,
        nextQpdfSettings: QpdfSettings,
        nextGhostscriptSettings: GhostscriptSettings,
    ) => {
        if (nextEngine === "qpdf") {
            return {
                engine: "qpdf" as const,
                ...nextQpdfSettings,
            };
        }

        return {
            engine: "ghostscript" as const,
            preset: nextGhostscriptSettings.preset,
            compatibilityLevel: nextGhostscriptSettings.compatibilityLevel,
            colorConversionStrategy: nextGhostscriptSettings.colorConversionStrategy,
            downsampleColorImages: nextGhostscriptSettings.downsampleColorImages,
            downsampleGrayImages: nextGhostscriptSettings.downsampleGrayImages,
            colorImageResolution: nextGhostscriptSettings.colorImageResolution,
            grayImageResolution: nextGhostscriptSettings.grayImageResolution,
            jpegQuality: nextGhostscriptSettings.jpegQuality,
        };
    };

    const processFile = async (
        nextFile: File,
        nextSourceData: Uint8Array,
        nextEngine: CompressionEngine = engine,
        nextQpdfSettings: QpdfSettings = qpdfSettings,
        nextGhostscriptSettings: GhostscriptSettings = ghostscriptSettings,
    ) => {
        await runJob({
            execute: async () => {
                return compressPdf(nextSourceData, buildCompressionOptions(nextEngine, nextQpdfSettings, nextGhostscriptSettings));
            },
            errorMessage: t("compress.status.failed"),
            successStatus: (nextResult) =>
                nextResult.savedBytes >= 0
                    ? { tone: "success", message: t("compress.status.savedBytes", { bytes: formatBytes(nextResult.savedBytes) }) }
                    : { tone: "info", message: t("compress.status.slightlyLarger") },
        });
    };

    const debouncedProcessFile = useDebouncedCallback(
        (
            nextFile: File,
            nextSourceData: Uint8Array,
            nextEngine: CompressionEngine,
            nextQpdfSettings: QpdfSettings,
            nextGhostscriptSettings: GhostscriptSettings,
        ) => {
            void processFile(nextFile, nextSourceData, nextEngine, nextQpdfSettings, nextGhostscriptSettings);
        },
        PDF_WASM_SIDE_EFFECT_DEBOUNCE_MS,
    );

    const scheduleRecompress = (
        nextEngine: CompressionEngine = engine,
        nextQpdfSettings: QpdfSettings = qpdfSettings,
        nextGhostscriptSettings: GhostscriptSettings = ghostscriptSettings,
    ) => {
        if (!file || !sourceData) {
            debouncedProcessFile.cancel();
            return;
        }

        debouncedProcessFile(file, sourceData, nextEngine, nextQpdfSettings, nextGhostscriptSettings);
    };

    const updateQpdfSettings = (patch: Partial<QpdfSettings>) => {
        const nextSettings = { ...qpdfSettings, ...patch };
        setQpdfSettings(nextSettings);
        scheduleRecompress(engine, nextSettings, ghostscriptSettings);
    };

    const updateGhostscriptSettings = (patch: Partial<GhostscriptSettings>) => {
        const nextSettings = { ...ghostscriptSettings, ...patch };
        setGhostscriptSettings(nextSettings);
        scheduleRecompress(engine, qpdfSettings, nextSettings);
    };

    const selectEngine = (nextEngine: CompressionEngine) => {
        setEngine(nextEngine);
        scheduleRecompress(nextEngine, qpdfSettings, ghostscriptSettings);
    };

    const selectQpdfPreset = (preset: QpdfOptimizePreset) => {
        updateQpdfSettings({ preset, ...OPTIMIZE_PRESETS[preset] });
    };

    const selectGhostscriptPreset = (preset: GhostscriptPdfSettings) => {
        updateGhostscriptSettings({ preset });
    };

    const handleFiles = async (files: File[]) => {
        const nextFile = findFirstPdfFile(files);

        if (!nextFile) {
            setStatus({ tone: "error", message: t("common.selectPdf") });
            return;
        }

        try {
            const nextSourceData = new Uint8Array(await nextFile.arrayBuffer());

            reset();
            debouncedProcessFile.cancel();
            setPreviewPage(1);
            setPreviewPageCount(0);
            setFile(nextFile);
            setSourceData(nextSourceData);
            void processFile(nextFile, nextSourceData);
        } catch (error) {
            setStatus({ tone: "error", message: error instanceof Error ? error.message : t("common.selectPdf") });
        }
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

    const getResultPresetLabel = (nextResult: CompressResult) => {
        return nextResult.engine === "qpdf"
            ? qpdfPresetLabels[nextResult.preset as QpdfOptimizePreset]
            : ghostscriptPresetLabels[nextResult.preset as GhostscriptPdfSettings];
    };

    const sidebar = (
        <Sidebar>
            <SidebarSection>
                <SidebarHeader>{t("compress.engine.header")}</SidebarHeader>
                <SidebarContent>
                    <SidebarToggleGroup>
                        {(["qpdf", "ghostscript"] as CompressionEngine[]).map((candidate) => (
                            <SidebarToggle
                                key={candidate}
                                isActive={engine === candidate}
                                title={engineDescriptions[candidate]}
                                onClick={() => selectEngine(candidate)}
                            >
                                {engineLabels[candidate]}
                            </SidebarToggle>
                        ))}
                    </SidebarToggleGroup>
                    <p className="mt-1.5 text-[11px] text-neutral-500">{engineDescriptions[engine]}</p>
                </SidebarContent>
            </SidebarSection>

            <SidebarSection>
                <SidebarHeader>{t("compress.preset.header")}</SidebarHeader>
                <SidebarContent>
                    <SidebarToggleGroup>
                        {engine === "qpdf"
                            ? QPDF_PRESETS.map((preset) => (
                                  <SidebarToggle
                                      key={preset}
                                      isActive={qpdfSettings.preset === preset}
                                      title={qpdfPresetDescriptions[preset]}
                                      onClick={() => selectQpdfPreset(preset)}
                                  >
                                      {qpdfPresetLabels[preset]}
                                  </SidebarToggle>
                              ))
                            : GHOSTSCRIPT_PRESETS.map((preset) => (
                                  <SidebarToggle
                                      key={preset}
                                      isActive={ghostscriptSettings.preset === preset}
                                      title={ghostscriptPresetDescriptions[preset]}
                                      onClick={() => selectGhostscriptPreset(preset)}
                                  >
                                      {ghostscriptPresetLabels[preset]}
                                  </SidebarToggle>
                              ))}
                    </SidebarToggleGroup>
                    <p className="mt-1.5 text-[11px] text-neutral-500">{activePresetDescription}</p>
                </SidebarContent>
            </SidebarSection>

            {engine === "qpdf" ? (
                <>
                    <SidebarCollapsibleSection title={t("compress.sidebar.advanced")} storageKey="compress-qpdf-advanced">
                        <SidebarContent>
                            <SidebarField label={t("compress.sidebar.level")}>
                                <SidebarRange
                                    max={9}
                                    min={1}
                                    value={qpdfSettings.compressionLevel}
                                    valueLabel={qpdfSettings.compressionLevel}
                                    onValueChange={(compressionLevel) => updateQpdfSettings({ compressionLevel })}
                                />
                            </SidebarField>
                            <SidebarField label={t("compress.sidebar.decode")}>
                                <SidebarSelect
                                    options={decodeLevelOptions}
                                    value={qpdfSettings.decodeLevel}
                                    onValueChange={(decodeLevel) => updateQpdfSettings({ decodeLevel })}
                                />
                            </SidebarField>
                            <SidebarField label={t("compress.sidebar.objectStreams")}>
                                <SidebarSelect
                                    options={objectStreamOptions}
                                    value={qpdfSettings.objectStreams}
                                    onValueChange={(objectStreams) => updateQpdfSettings({ objectStreams })}
                                />
                            </SidebarField>
                        </SidebarContent>
                    </SidebarCollapsibleSection>

                    <SidebarCollapsibleSection title={t("compress.sidebar.streamOptions")} storageKey="compress-qpdf-stream-options">
                        <SidebarContent>
                            <SidebarCheckbox
                                checked={qpdfSettings.linearize}
                                label={t("compress.sidebar.linearize")}
                                onChange={(event) => updateQpdfSettings({ linearize: event.currentTarget.checked })}
                            />
                            <SidebarCheckbox
                                checked={qpdfSettings.recompressFlate}
                                label={t("compress.sidebar.recompressFlate")}
                                onChange={(event) => updateQpdfSettings({ recompressFlate: event.currentTarget.checked })}
                            />
                            <SidebarCheckbox
                                checked={qpdfSettings.compressPages}
                                label={t("compress.sidebar.compressPages")}
                                onChange={(event) => updateQpdfSettings({ compressPages: event.currentTarget.checked })}
                            />
                            <SidebarCheckbox
                                checked={qpdfSettings.removeUnreferencedResources}
                                label={t("compress.sidebar.removeUnused")}
                                onChange={(event) => updateQpdfSettings({ removeUnreferencedResources: event.currentTarget.checked })}
                            />
                        </SidebarContent>
                    </SidebarCollapsibleSection>
                </>
            ) : (
                <>
                    <SidebarCollapsibleSection title={t("compress.sidebar.imageSettings")} storageKey="compress-ghostscript-images">
                        <SidebarContent>
                            <SidebarCheckbox
                                checked={ghostscriptSettings.downsampleColorImages}
                                label={t("compress.sidebar.downsampleColor")}
                                onChange={(event) => updateGhostscriptSettings({ downsampleColorImages: event.currentTarget.checked })}
                            />
                            <SidebarField label={t("compress.sidebar.colorResolution")}>
                                <SidebarRange
                                    max={300}
                                    min={36}
                                    step={6}
                                    value={ghostscriptSettings.colorImageResolution}
                                    valueLabel={`${ghostscriptSettings.colorImageResolution}`}
                                    onValueChange={(colorImageResolution) => updateGhostscriptSettings({ colorImageResolution })}
                                />
                            </SidebarField>
                            <SidebarCheckbox
                                checked={ghostscriptSettings.downsampleGrayImages}
                                label={t("compress.sidebar.downsampleGray")}
                                onChange={(event) => updateGhostscriptSettings({ downsampleGrayImages: event.currentTarget.checked })}
                            />
                            <SidebarField label={t("compress.sidebar.grayResolution")}>
                                <SidebarRange
                                    max={300}
                                    min={36}
                                    step={6}
                                    value={ghostscriptSettings.grayImageResolution}
                                    valueLabel={`${ghostscriptSettings.grayImageResolution}`}
                                    onValueChange={(grayImageResolution) => updateGhostscriptSettings({ grayImageResolution })}
                                />
                            </SidebarField>
                            <SidebarField label={t("compress.sidebar.jpegQuality")}>
                                <SidebarRange
                                    max={100}
                                    min={0}
                                    value={ghostscriptSettings.jpegQuality}
                                    valueLabel={ghostscriptSettings.jpegQuality}
                                    onValueChange={(jpegQuality) => updateGhostscriptSettings({ jpegQuality })}
                                />
                            </SidebarField>
                        </SidebarContent>
                    </SidebarCollapsibleSection>

                    <SidebarCollapsibleSection title={t("compress.sidebar.outputSettings")} storageKey="compress-ghostscript-output">
                        <SidebarContent>
                            <SidebarField label={t("compress.sidebar.compatibility")}>
                                <SidebarSelect
                                    options={ghostscriptCompatibilityOptions}
                                    value={ghostscriptSettings.compatibilityLevel}
                                    onValueChange={(compatibilityLevel) => updateGhostscriptSettings({ compatibilityLevel })}
                                />
                            </SidebarField>
                            <SidebarField label={t("compress.sidebar.colorStrategy")}>
                                <SidebarSelect
                                    options={ghostscriptColorStrategyOptions}
                                    value={ghostscriptSettings.colorConversionStrategy}
                                    onValueChange={(colorConversionStrategy) => updateGhostscriptSettings({ colorConversionStrategy })}
                                />
                            </SidebarField>
                        </SidebarContent>
                    </SidebarCollapsibleSection>
                </>
            )}

            <SidebarInfo>{t(engine === "qpdf" ? "compress.notes.qpdf" : "compress.notes.ghostscript")}</SidebarInfo>
        </Sidebar>
    );

    const centerContent = file ? (
        <div className="relative h-full w-full">
            <ComparisonSlider
                after={result ? <PdfPreview data={result.data} page={previewPage} showControls={false} onPageChange={updatePreviewPage} /> : undefined}
                before={<PdfPreview data={sourceData} page={previewPage} showControls={false} onPageChange={updatePreviewPage} onPageCountChange={setPreviewPageCount} />}
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
                              { label: t("compress.metrics.engine"), value: engineLabels[result.engine] },
                              { label: t("common.metrics.output"), value: formatBytes(result.compressedSize) },
                              { label: t("compress.preset.header"), value: getResultPresetLabel(result) },
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
                    void handleFiles(Array.from(event.currentTarget.files ?? []));
                    event.currentTarget.value = "";
                }}
            />
            <ToolLayout onFiles={handleFiles} sidebar={sidebar} title={t("compress.toolTitle")}>
                {centerContent}
            </ToolLayout>
        </>
    );
}
