import { createClientOnlyFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";

const loadPdfRenderer = createClientOnlyFn(async () => import("@/utils/pdfRenderer.client"));

/**
 * Fixed thumbnail width in CSS pixels. Avoids a ResizeObserver per card —
 * the container is a fixed-aspect grid cell so a constant scale is sufficient.
 */
const THUMBNAIL_WIDTH_PX = 200;

interface PdfPageThumbnailProps {
    /** Raw bytes of a single-page PDF to render as a thumbnail. */
    data: Uint8Array;
}

/**
 * Lightweight PDF thumbnail for use in grid-style output views (e.g. SplitTool).
 *
 * Unlike `PdfPreview`, this component:
 * - Does **not** create a ResizeObserver per instance.
 * - Renders lazily via IntersectionObserver — no work is done until the card
 *   scrolls into the viewport.
 * - Destroys the pdf.js document immediately after the first render to free
 *   memory (thumbnails are static; no page navigation is needed).
 * - Uses a fixed thumbnail scale instead of dynamic container-aware scaling.
 */
export function PdfPageThumbnail({ data }: PdfPageThumbnailProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isRendered, setIsRendered] = useState(false);

    useEffect(() => {
        const element = containerRef.current;
        if (!element) return;

        let cancelled = false;

        const render = async () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            try {
                const renderer = await loadPdfRenderer();
                if (!renderer || cancelled) return;

                const doc = await renderer.loadPdfDocument(data);
                if (cancelled) {
                    void doc.destroy();
                    return;
                }

                const pdfPage = await doc.getPage(1);
                if (cancelled) {
                    void doc.destroy();
                    return;
                }

                const baseViewport = pdfPage.getViewport({ scale: 1 });
                const scale = THUMBNAIL_WIDTH_PX / baseViewport.width;

                await renderer.renderPdfPageToCanvas({
                    pdfPage,
                    canvas,
                    scale,
                    shouldCommit: () => !cancelled,
                });

                void doc.destroy();
                if (!cancelled) setIsRendered(true);
            } catch (error) {
                console.error("Failed to render PDF thumbnail", error);
            }
        };

        if (typeof IntersectionObserver === "undefined") {
            void render();
            return () => {
                cancelled = true;
            };
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) {
                    observer.disconnect();
                    void render();
                }
            },
            { rootMargin: "150px" },
        );

        observer.observe(element);

        return () => {
            cancelled = true;
            observer.disconnect();
        };
    }, [data]);

    return (
        <div ref={containerRef} className="relative flex h-full w-full items-center justify-center overflow-hidden bg-app-bg">
            <canvas ref={canvasRef} className="block max-h-full max-w-full" />
            {!isRendered && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="size-4 animate-spin rounded-full border-2 border-muted-foreground border-t-app-text-muted" />
                </div>
            )}
        </div>
    );
}
