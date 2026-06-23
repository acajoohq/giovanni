import { cn } from "@/lib/utils";

/** Soft brand glow. Position it via className (left/top/size/translate). */
export function HeroGlow({ className }: { className?: string }) {
    return (
        <div
            aria-hidden
            className={cn("pointer-events-none absolute rounded-full", className)}
            style={{ background: "radial-gradient(circle, rgba(235,90,63,0.12), transparent 60%)" }}
        />
    );
}
