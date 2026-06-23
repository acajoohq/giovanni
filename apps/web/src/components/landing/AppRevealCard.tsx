import { motion, type MotionValue } from "motion/react";
import { CompressTool } from "@/components/pdf/tools/CompressTool";

interface AppRevealCardProps {
    /** Vertical offset of the card, e.g. "72%" peeking → "0%" docked. */
    y: MotionValue<string> | string;
    /** Scale of the card, e.g. 0.92 → 1. */
    scale: MotionValue<number> | number;
    /** Corner radius in px, e.g. 28 → 0. */
    borderRadius: MotionValue<number> | number;
}

/**
 * The live app, presented as a card that rises from the bottom and docks
 * full-bleed as the user scrolls — turning the landing into a usable workspace.
 */
export function AppRevealCard({ y, scale, borderRadius }: AppRevealCardProps) {
    return (
        <motion.div
            className="absolute inset-0 z-10 overflow-hidden border border-app-border/60 bg-app-bg shadow-result-tray will-change-transform"
            style={{ y, scale, borderRadius }}
        >
            <CompressTool />
        </motion.div>
    );
}
