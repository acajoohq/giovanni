import * as SQLite from "expo-sqlite";

import { DEFAULT_DOCSCANNER_MODEL_ID } from "@/lib/model/docscannerModel.constants";
import { isDocScannerModelId } from "@/lib/model/docscannerModel.types";
import type { DocScannerModelId } from "@/lib/model/docscannerModel.types";
import { DEFAULT_PROCESSING_LONG_EDGE, isProcessingLongEdge } from "@/lib/scanner/processingResolution.constants";
import type { ProcessingLongEdge } from "@/lib/scanner/processingResolution.constants";

const SELECTED_MODEL_KEY = "docscanner_model_id";
const MAX_PROCESSING_LONG_EDGE_KEY = "max_processing_long_edge";

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDatabase(): Promise<SQLite.SQLiteDatabase> {
    databasePromise ??= SQLite.openDatabaseAsync("doc-scanner.db");
    return databasePromise;
}

export async function initializeScannerSettings(): Promise<void> {
    const database = await getDatabase();

    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
}

export async function getSelectedDocScannerModelId(): Promise<DocScannerModelId> {
    const database = await getDatabase();
    const rows = await database.getAllAsync<{ value: string }>("SELECT value FROM app_settings WHERE key = ? LIMIT 1", [SELECTED_MODEL_KEY]);
    const storedValue = rows[0]?.value;

    if (storedValue === "docscanner-fp16-onnx") {
        return DEFAULT_DOCSCANNER_MODEL_ID;
    }

    if (storedValue && isDocScannerModelId(storedValue)) {
        return storedValue;
    }

    return DEFAULT_DOCSCANNER_MODEL_ID;
}

export async function setSelectedDocScannerModelId(modelId: DocScannerModelId): Promise<void> {
    const database = await getDatabase();

    await database.runAsync("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)", [SELECTED_MODEL_KEY, modelId]);
}

export async function getMaxProcessingLongEdge(): Promise<ProcessingLongEdge> {
    const database = await getDatabase();
    const rows = await database.getAllAsync<{ value: string }>("SELECT value FROM app_settings WHERE key = ? LIMIT 1", [MAX_PROCESSING_LONG_EDGE_KEY]);
    const storedValue = rows[0]?.value;
    const parsedValue = storedValue ? Number(storedValue) : Number.NaN;

    if (isProcessingLongEdge(parsedValue)) {
        return parsedValue;
    }

    return DEFAULT_PROCESSING_LONG_EDGE;
}

export async function setMaxProcessingLongEdge(value: ProcessingLongEdge): Promise<void> {
    const database = await getDatabase();

    await database.runAsync("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)", [MAX_PROCESSING_LONG_EDGE_KEY, String(value)]);
}
