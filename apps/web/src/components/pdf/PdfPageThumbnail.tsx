import { createClientOnlyFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";

const loadPdfRenderer = createClientOnlyFn(async () => import("@/utils/pdf/pdfRenderer.client"));

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
    const [isVisible, setIsVisible] = useState(false);
    const [isRendered, setIsRendered] = useState(false);

    // Step 1: observe the container and flip `isVisible` once it enters the viewport.
    useEffect(() => {
        const element = containerRef.current;

        if (!element) {
            return;
        }

        if (typeof IntersectionObserver === "undefined") {
            // SSR / old browsers: render immediately.
            setIsVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "150px" },
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, []);

    // Step 2: once visible, load and render page 1 at a fixed thumbnail scale.
    useEffect(() => {
        if (!isVisible) {
            return;
        }

        let cancelled = false;

        const render = async () => {
            const canvas = canvasRef.current;

            if (!canvas) {
                return;
            }

            try {
                const renderer = await loadPdfRenderer();

                if (!renderer || cancelled) {
                    return;
                }

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

                // Free memory — thumbnails are static, no further interaction needed.
                void doc.destroy();

                if (!cancelled) {
                    setIsRendered(true);
                }
            } catch (error) {
                console.error("Failed to render PDF thumbnail", error);
            }
        };

        void render();

        return () => {
            cancelled = true;
        };
    }, [isVisible, data]);

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
