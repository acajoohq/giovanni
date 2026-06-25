import type { ToolAction } from "@/types/toolRoute.types";

/** Nav i18n keys mapped to shared tool-route actions. */
export const LANDING_TOOL_ACTION = {
    compress: "compress",
    split: "split",
    merge: "merge",
    organize: "organize",
    extractImages: "extract-images",
    pdfToJpg: "pdf-to-jpg",
} as const satisfies Record<string, ToolAction>;

export const LANDING_TOOL_KEYS = ["compress", "split", "merge", "organize", "extractImages", "pdfToJpg"] as const satisfies readonly (keyof typeof LANDING_TOOL_ACTION)[];

export const DEFAULT_LANDING_TOOL = "compress" satisfies (typeof LANDING_TOOL_KEYS)[number];
