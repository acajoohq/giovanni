export const PROCESSING_LONG_EDGE_OPTIONS = [1200, 1600, 1920, 2400] as const;

export type ProcessingLongEdge = (typeof PROCESSING_LONG_EDGE_OPTIONS)[number];

export const DEFAULT_PROCESSING_LONG_EDGE = 1920 satisfies ProcessingLongEdge;

export const ABSOLUTE_MAX_PROCESSING_LONG_EDGE = 2400 satisfies ProcessingLongEdge;

export const MIN_PROCESSING_LONG_EDGE = 960;

export type ProcessingLongEdgeOption = {
    value: ProcessingLongEdge;
    label: string;
    description: string;
};

export const PROCESSING_LONG_EDGE_PRESETS: ProcessingLongEdgeOption[] = [
    {
        value: 1200,
        label: "Fast",
        description: "Lower map resolution · quickest E2E",
    },
    {
        value: 1600,
        label: "Balanced",
        description: "Good speed/quality tradeoff",
    },
    {
        value: 1920,
        label: "High",
        description: "Default · matches FHD captures well",
    },
    {
        value: 2400,
        label: "Max",
        description: "Largest map · slowest E2E",
    },
];

export function isProcessingLongEdge(value: number): value is ProcessingLongEdge {
    return (PROCESSING_LONG_EDGE_OPTIONS as readonly number[]).includes(value);
}

export function getProcessingLongEdgeOption(value: ProcessingLongEdge): ProcessingLongEdgeOption {
    const option = PROCESSING_LONG_EDGE_PRESETS.find((entry) => entry.value === value);
    if (!option) {
        throw new Error(`Unknown processing long edge: ${value}`);
    }
    return option;
}
