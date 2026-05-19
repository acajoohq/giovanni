import { describe, expect, it, vi } from "vitest";

import type { ScanRecord } from "@/lib/scanner/scan.types";

const runAsync = vi.fn<() => Promise<unknown>>();
const execAsync = vi.fn<() => Promise<void>>();
const getAllAsync = vi.fn<() => Promise<unknown[]>>();

vi.mock("expo-sqlite", () => ({
    openDatabaseAsync: vi.fn<() => Promise<{ execAsync: typeof execAsync; getAllAsync: typeof getAllAsync; runAsync: typeof runAsync }>>(async () => ({
        execAsync,
        getAllAsync,
        runAsync,
    })),
}));

describe("scans repository", () => {
    it("creates the scans table before use", async () => {
        const { initializeScansRepository } = await import("@/lib/storage/scans.repository");

        await initializeScansRepository();

        expect(execAsync).toHaveBeenCalledWith(expect.stringContaining("CREATE TABLE IF NOT EXISTS scans"));
    });

    it("persists scan metadata with stable fields", async () => {
        const { insertScan } = await import("@/lib/storage/scans.repository");
        const scan: ScanRecord = {
            id: "scan-1",
            source: "gallery",
            status: "processed",
            createdAt: "2026-05-18T10:00:00.000Z",
            originalUri: "file:///original.jpg",
            rectifiedUri: "file:///rectified.jpg",
            width: 1200,
            height: 1600,
            processingMs: 420,
            modelVersion: "docscanner-fp16-onnx",
            warning: null,
        };

        await insertScan(scan);

        expect(runAsync).toHaveBeenCalledWith(expect.stringContaining("INSERT OR REPLACE INTO scans"), [
            scan.id,
            scan.source,
            scan.status,
            scan.createdAt,
            scan.originalUri,
            scan.rectifiedUri,
            scan.width,
            scan.height,
            scan.processingMs,
            scan.modelVersion,
            scan.warning,
        ]);
    });

    it("loads recent scans newest first", async () => {
        const rows = [{ id: "scan-1" }];
        getAllAsync.mockResolvedValueOnce(rows);
        const { listRecentScans } = await import("@/lib/storage/scans.repository");

        await expect(listRecentScans()).resolves.toEqual(rows);

        expect(getAllAsync).toHaveBeenCalledWith("SELECT * FROM scans ORDER BY createdAt DESC LIMIT 50");
    });
});
