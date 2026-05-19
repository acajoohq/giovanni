import * as SQLite from "expo-sqlite";

import type { ScanRecord } from "@/lib/scanner/scan.types";

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDatabase(): Promise<SQLite.SQLiteDatabase> {
    databasePromise ??= SQLite.openDatabaseAsync("doc-scanner.db");
    return databasePromise;
}

export async function initializeScansRepository(): Promise<void> {
    const database = await getDatabase();

    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS scans (
      id TEXT PRIMARY KEY NOT NULL,
      source TEXT NOT NULL,
      status TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      originalUri TEXT NOT NULL,
      rectifiedUri TEXT NOT NULL,
      width INTEGER,
      height INTEGER,
      processingMs INTEGER NOT NULL,
      modelVersion TEXT NOT NULL,
      warning TEXT
    );
  `);
}

export async function insertScan(scan: ScanRecord): Promise<void> {
    const database = await getDatabase();

    await database.runAsync(
        `INSERT OR REPLACE INTO scans (
      id, source, status, createdAt, originalUri, rectifiedUri,
      width, height, processingMs, modelVersion, warning
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [scan.id, scan.source, scan.status, scan.createdAt, scan.originalUri, scan.rectifiedUri, scan.width, scan.height, scan.processingMs, scan.modelVersion, scan.warning],
    );
}

export async function listRecentScans(): Promise<ScanRecord[]> {
    const database = await getDatabase();

    return database.getAllAsync<ScanRecord>("SELECT * FROM scans ORDER BY createdAt DESC LIMIT 50");
}

export async function getScanById(id: string): Promise<ScanRecord | null> {
    const database = await getDatabase();
    const rows = await database.getAllAsync<ScanRecord>("SELECT * FROM scans WHERE id = ? LIMIT 1", [id]);

    return rows[0] ?? null;
}
