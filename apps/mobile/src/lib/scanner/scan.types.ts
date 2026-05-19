export type ScanSource = "camera" | "gallery";
export type ScanStatus = "processed" | "fallback";

export interface ScanRecord {
    id: string;
    source: ScanSource;
    status: ScanStatus;
    createdAt: string;
    originalUri: string;
    rectifiedUri: string;
    width: number | null;
    height: number | null;
    processingMs: number;
    modelVersion: string;
    warning: string | null;
}

export interface ScanTiming {
    label: string;
    ms: number;
}

export interface ProcessScanResult {
    scan: ScanRecord;
    timings: ScanTiming[];
}

export interface PreparedDocumentImage {
    input: Float32Array;
    width: number;
    height: number;
}

export interface RectifyFlowInput {
    sourceUri: string;
    outputUri: string;
    width: number;
    height: number;
    flow: Float32Array;
    maxProcessingLongEdge: number;
}

export interface SaveRectifiedTensorInput {
    tensor: Float32Array;
    outputUri: string;
    width: number;
    height: number;
}
