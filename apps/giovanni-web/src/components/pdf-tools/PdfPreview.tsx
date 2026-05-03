import * as React from "react";
import { RiArrowLeftSLine, RiArrowRightSLine, RiFilePdf2Line } from "@remixicon/react";
import { calculatePdfScale, loadPdfDocument, renderPdfPageToCanvas, type PDFDocumentProxy } from "../../utils/pdfRenderer";

interface PdfPreviewProps {
    data?: Uint8Array | null;
    file?: File | null;
    placeholder?: React.ReactNode;
}

export function PdfPreview({ data, file, placeholder }: PdfPreviewProps) {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [pdfDoc, setPdfDoc] = React.useState<PDFDocumentProxy | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [page, setPage] = React.useState(1);
    const [containerSize, setContainerSize] = React.useState<{ width: number; height: number } | null>(null);

    // debounced resize: fires only after 150ms of inactivity to avoid re-rendering mid-drag
    React.useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        let timer: ReturnType<typeof setTimeout> | null = null;
        const ro = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                setContainerSize((prev) => {
                    if (prev && Math.abs(prev.width - width) < 5 && Math.abs(prev.height - height) < 5) return prev;
                    return { width, height };
                });
            }, 150);
        });
        ro.observe(el);
        return () => {
            ro.disconnect();
            if (timer) clearTimeout(timer);
        };
    }, []);

    React.useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setIsLoading(true);
            setPdfDoc(null);
            setPage(1);
            try {
                let source: Uint8Array | ArrayBuffer | null = null;
                if (data) source = data;
                else if (file) source = await file.arrayBuffer();
                if (!source || cancelled) return;
                const doc = await loadPdfDocument(source);
                if (!cancelled) setPdfDoc(doc);
            } catch {
                if (!cancelled) setPdfDoc(null);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [data, file]);

    // no isRendering overlay: offscreen canvas keeps old frame visible until the new one is composited
    React.useEffect(() => {
        let cancelled = false;
        const render = async () => {
            if (!canvasRef.current || !pdfDoc) return;
            try {
                const pdfPage = await pdfDoc.getPage(page);
                if (cancelled) return;
                const baseViewport = pdfPage.getViewport({ scale: 1 });
                const scale = calculatePdfScale({ baseViewport, viewerSize: containerSize, pdfDocument: pdfDoc });
                await renderPdfPageToCanvas({ pdfPage, canvas: canvasRef.current, scale });
            } catch (err) {
                if ((err as Error)?.name !== "RenderingCancelledException") {
                    console.error("pdf render error", err);
                }
            }
        };
        if (pdfDoc) render();
        return () => { cancelled = true; };
    }, [pdfDoc, page, containerSize]);

    const totalPages = pdfDoc?.numPages ?? 0;
    const hasSource = Boolean(data ?? file);

    return (
        <div ref={containerRef} className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-[#0a0a0a]">
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

                    <canvas
                        ref={canvasRef}
                        className="block max-h-full max-w-full"
                        style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.6))" }}
                    />

                    {totalPages > 1 && (
                        <div className="mt-3 flex shrink-0 items-center gap-2 rounded-md border border-[#2a2a2a] bg-[#181818] px-2 py-1">
                            <button
                                className="flex size-6 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-[#252525] hover:text-white disabled:opacity-30"
                                disabled={page === 1}
                                onClick={() => setPage((p) => p - 1)}
                                type="button"
                            >
                                <RiArrowLeftSLine className="size-4" />
                            </button>
                            <span className="min-w-[52px] text-center text-[11px] font-medium text-neutral-400">
                                {page} / {totalPages}
                            </span>
                            <button
                                className="flex size-6 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-[#252525] hover:text-white disabled:opacity-30"
                                disabled={page === totalPages}
                                onClick={() => setPage((p) => p + 1)}
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
