import { RiArrowLeftSLine, RiArrowRightSLine, RiFilePdf2Line } from "@remixicon/react";
import { createClientOnlyFn } from "@tanstack/react-start";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { PDFDocumentProxy } from "@/utils/pdf/pdfRenderer.client";

type PdfRendererClient = typeof import("@/utils/pdf/pdfRenderer.client");

const loadPdfRenderer = createClientOnlyFn(async () => import("@/utils/pdf/pdfRenderer.client"));

interface PdfPreviewProps {
    data?: Uint8Array | null;
    file?: File | null;
    page?: number;
    onPageChange?: (page: number) => void;
    onPageCountChange?: (pageCount: number) => void;
    placeholder?: ReactNode;
    showControls?: boolean;
}

export function PdfPreview({ data, file, page: controlledPage, onPageChange, onPageCountChange, placeholder, showControls = true }: PdfPreviewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const renderGenerationRef = useRef(0);
    const [renderer, setRenderer] = useState<PdfRendererClient | null>(null);
    const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [internalPage, setInternalPage] = useState(1);
    const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);
    const page = controlledPage ?? internalPage;

    useEffect(() => {
        const element = containerRef.current;

        if (!element || typeof ResizeObserver === "undefined") {
            return;
        }

        let timer: ReturnType<typeof setTimeout> | null = null;
        const resizeObserver = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;

            if (timer) {
                clearTimeout(timer);
            }

            timer = setTimeout(() => {
                setContainerSize((previousSize) => {
                    if (previousSize && Math.abs(previousSize.width - width) < 5 && Math.abs(previousSize.height - height) < 5) {
                        return previousSize;
                    }

                    return { width, height };
                });
            }, 150);
        });

        resizeObserver.observe(element);

        return () => {
            resizeObserver.disconnect();

            if (timer) {
                clearTimeout(timer);
            }
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setIsLoading(true);
            setPdfDoc((prevDoc) => {
                if (prevDoc) {
                    void prevDoc.destroy();
                }

                return null;
            });
            setInternalPage(1);

            try {
                const source = data ?? (file ? await file.arrayBuffer() : null);

                if (!source || cancelled) {
                    return;
                }

                const pdfRenderer = await loadPdfRenderer();
                const doc = await pdfRenderer.loadPdfDocument(source);

                if (!cancelled) {
                    setRenderer(pdfRenderer);
                    setPdfDoc(doc);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error("Failed to load PDF preview", error);
                    setPdfDoc(null);
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        void load();

        return () => {
            cancelled = true;
            setPdfDoc((prevDoc) => {
                if (prevDoc) {
                    void prevDoc.destroy();
                }

                return null;
            });
        };
    }, [data, file]);

    useEffect(() => {
        if (!pdfDoc || page <= pdfDoc.numPages) {
            return;
        }

        const nextPage = Math.max(1, pdfDoc.numPages);

        if (controlledPage === undefined) {
            setInternalPage(nextPage);
        } else {
            onPageChange?.(nextPage);
        }
    }, [controlledPage, onPageChange, page, pdfDoc]);

    useEffect(() => {
        let cancelled = false;
        const renderGeneration = ++renderGenerationRef.current;

        const render = async () => {
            if (!canvasRef.current || !pdfDoc || !renderer) {
                return;
            }

            try {
                const pdfPage = await pdfDoc.getPage(page);

                if (cancelled) {
                    return;
                }

                const baseViewport = pdfPage.getViewport({ scale: 1 });
                const scale = renderer.calculatePdfScale({ baseViewport, viewerSize: containerSize, pdfDocument: pdfDoc });
                await renderer.renderPdfPageToCanvas({
                    pdfPage,
                    canvas: canvasRef.current,
                    scale,
                    shouldCommit: () => !cancelled && renderGeneration === renderGenerationRef.current,
                });
            } catch (error) {
                if ((error as Error)?.name !== "RenderingCancelledException") {
                    console.error("pdf render error", error);
                }
            }
        };

        void render();

        return () => {
            cancelled = true;
        };
    }, [containerSize, page, pdfDoc, renderer]);

    const totalPages = pdfDoc?.numPages ?? 0;
    const hasSource = Boolean(data ?? file);

    useEffect(() => {
        onPageCountChange?.(totalPages);
    }, [onPageCountChange, totalPages]);

    const setPage = (nextPage: number | ((currentPage: number) => number)) => {
        const resolvedPage = typeof nextPage === "function" ? nextPage(page) : nextPage;

        if (controlledPage === undefined) {
            setInternalPage(resolvedPage);
        } else {
            onPageChange?.(resolvedPage);
        }
    };

    return (
        <div ref={containerRef} className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-app-bg">
            {!hasSource && (
                <div className="flex flex-col items-center gap-2 text-app-text-subtle">
                    {placeholder ?? (
                        <>
                            <RiFilePdf2Line className="size-12 opacity-20" />
                            <span className="text-[12px]">No preview</span>
                        </>
                    )}
                </div>
            )}

            {hasSource && (
                <>
                    {isLoading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30">
                            <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground border-t-app-text-muted" />
                        </div>
                    )}

                    <canvas ref={canvasRef} className="block max-h-full max-w-full" style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.6))" }} />

                    {showControls && totalPages > 1 && (
                        <div className="relative z-30 mt-3 flex shrink-0 items-center gap-2 rounded-md border border-app-border bg-app-panel px-2 py-1">
                            <button
                                className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-app-control-hover hover:text-foreground disabled:opacity-30"
                                disabled={page === 1}
                                type="button"
                                onClick={() => setPage((currentPage) => currentPage - 1)}
                            >
                                <RiArrowLeftSLine className="size-4" />
                            </button>
                            <span className="min-w-[52px] text-center text-[11px] font-medium text-muted-foreground">
                                {page} / {totalPages}
                            </span>
                            <button
                                className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-app-control-hover hover:text-foreground disabled:opacity-30"
                                disabled={page === totalPages}
                                type="button"
                                onClick={() => setPage((currentPage) => currentPage + 1)}
                            >
                                <RiArrowRightSLine className="size-4" />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
