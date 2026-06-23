import { cn } from "@/lib/utils";

/** Positioning base: overlay (behind the card) vs static (stacked). */
export function heroRootClass(isOverlay: boolean) {
    return cn("px-6", isOverlay ? "absolute inset-0" : "relative min-h-full w-full py-20");
}
