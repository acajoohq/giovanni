import type { ReactNode } from "react";
import { motion, type MotionValue } from "motion/react";

interface AppRevealCardProps {
    y: MotionValue<string> | string;
    scale: MotionValue<number> | number;
    borderRadius: MotionValue<number> | number;
    children: ReactNode;
}

export function AppRevealCard({ y, scale, borderRadius, children }: AppRevealCardProps) {
    return (
        <motion.div
            className="absolute inset-0 z-10 overflow-hidden border border-app-border/60 bg-app-bg shadow-result-tray will-change-transform"
            style={{ y, scale, borderRadius }}
        >
            {children}
        </motion.div>
    );
}
