import type { ReactNode } from "react";
import { motion, type MotionValue } from "motion/react";
import { cn } from "@/lib/utils";

interface AppRevealCardProps {
    y: MotionValue<string> | string;
    scale: MotionValue<number> | number;
    borderRadius: MotionValue<number> | number;
    isDocked?: boolean;
    children: ReactNode;
}

export function AppRevealCard({ y, scale, borderRadius, isDocked = false, children }: AppRevealCardProps) {
    return (
        <motion.div
            className={cn(
                "absolute inset-0 z-10 overflow-hidden bg-app-bg will-change-transform",
                isDocked ? "border-transparent shadow-none" : "border border-app-border/60 shadow-result-tray",
            )}
            style={{ y, scale, borderRadius }}
        >
            {children}
        </motion.div>
    );
}
