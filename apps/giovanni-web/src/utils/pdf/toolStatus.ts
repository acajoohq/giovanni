export type ToolStatusTone = "info" | "success" | "error";

export interface ActiveToolStatus {
    tone: ToolStatusTone;
    message: string;
}

export type ToolStatus = ActiveToolStatus | null;
