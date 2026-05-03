import * as React from "react";

interface ComparisonSliderProps {
    before: React.ReactNode;
    after?: React.ReactNode;
    isProcessing?: boolean;
}

export function ComparisonSlider({ before, after, isProcessing }: ComparisonSliderProps) {
    const [position, setPosition] = React.useState(50);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const dragging = React.useRef(false);

    const showSlider = Boolean(after) && !isProcessing;

    const updatePosition = (clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setPosition(Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100)));
    };

    return (
        <div ref={containerRef} className="relative h-full w-full select-none overflow-hidden">
            {/* Back layer: after (or before when no output yet) */}
            <div className="absolute inset-0">
                {isProcessing ? <ProcessingPlaceholder /> : (after ?? before)}
            </div>

            {/* Front layer: before, clipped to left of divider */}
            {showSlider && (
                <div
                    className="absolute inset-0"
                    style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
                >
                    {before}
                </div>
            )}

            {/* Draggable divider */}
            {showSlider && (
                <div
                    className="absolute bottom-0 top-0 z-20 w-10 -translate-x-1/2 cursor-ew-resize touch-none"
                    style={{ left: `${position}%` }}
                    onPointerDown={(e) => {
                        e.currentTarget.setPointerCapture(e.pointerId);
                        dragging.current = true;
                    }}
                    onPointerMove={(e) => {
                        if (dragging.current) updatePosition(e.clientX);
                    }}
                    onPointerUp={() => {
                        dragging.current = false;
                    }}
                >
                    {/* Line */}
                    <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/40" />
                    {/* Handle */}
                    <div className="pointer-events-none absolute left-1/2 top-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/70 shadow-lg">
                        <svg className="size-3.5 text-white/60" fill="none" viewBox="0 0 14 14">
                            <path d="M5 3L2 7l3 4M9 3l3 4-3 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                        </svg>
                    </div>
                </div>
            )}

            {/* Labels */}
            {showSlider && (
                <>
                    <div className="pointer-events-none absolute left-2 top-2 z-10 rounded-full border border-white/10 bg-black/50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-white/40">
                        Input
                    </div>
                    <div className="pointer-events-none absolute right-2 top-2 z-10 rounded-full border border-white/10 bg-black/50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-white/40">
                        Output
                    </div>
                </>
            )}
        </div>
    );
}

function ProcessingPlaceholder() {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-neutral-600">
            <div className="size-5 animate-spin rounded-full border-2 border-[#252525] border-t-[#eb5a3f]" />
            <span className="text-[12px]">Processing…</span>
        </div>
    );
}
