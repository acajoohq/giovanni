import { RiArrowLeftSLine, RiArrowRightSLine, RiFilePdf2Line } from "@remixicon/react";
import { createClientOnlyFn } from "@tanstack/react-start";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { PDFDocumentProxy } from "@/lib/features/pdfTools/utils/pdfRenderer.client";

type PdfRendererClient = typeof import("@/lib/features/pdfTools/utils/pdfRenderer.client");

const loadPdfRenderer = createClientOnlyFn(async () => import("@/lib/features/pdfTools/utils/pdfRenderer.client"));

interface PdfPreviewProps {
    data?: Uint8Array | null;
    file?: File | null;
    placeholder?: ReactNode;
}

export function PdfPreview({ data, file, placeholder }: PdfPreviewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const renderGenerationRef = useRef(0);
    const [renderer, setRenderer] = useState<PdfRendererClient | null>(null);
    const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);

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
            setPdfDoc(null);
            setPage(1);

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
            } catch {
                if (!cancelled) {
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
        };
    }, [data, file]);

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

    return (
        <div ref={containerRef} className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-app-bg">
            {!hasSource && (
                <div className="flex flex-col items-center gap-2 text-neutral-600">
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
                            <div className="size-5 animate-spin rounded-full border-2 border-neutral-600 border-t-neutral-300" />
                        </div>
                    )}

                    <canvas ref={canvasRef} className="block max-h-full max-w-full" style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.6))" }} />

                    {totalPages > 1 && (
                        <div className="mt-3 flex shrink-0 items-center gap-2 rounded-md border border-app-border bg-app-panel px-2 py-1">
                            <button
                                className="flex size-6 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-app-control-hover hover:text-white disabled:opacity-30"
                                disabled={page === 1}
                                onClick={() => setPage((currentPage) => currentPage - 1)}
                                type="button"
                            >
                                <RiArrowLeftSLine className="size-4" />
                            </button>
                            <span className="min-w-[52px] text-center text-[11px] font-medium text-neutral-400">
                                {page} / {totalPages}
                            </span>
                            <button
                                className="flex size-6 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-app-control-hover hover:text-white disabled:opacity-30"
                                disabled={page === totalPages}
                                onClick={() => setPage((currentPage) => currentPage + 1)}
                                type="button"
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
