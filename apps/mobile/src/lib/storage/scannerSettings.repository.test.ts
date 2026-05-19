import { beforeEach, describe, expect, it, vi } from "vitest";

const runAsync = vi.fn();
const execAsync = vi.fn();
const getAllAsync = vi.fn();

vi.mock("expo-sqlite", () => ({
    openDatabaseAsync: vi.fn(async () => ({
        execAsync,
        getAllAsync,
        runAsync,
    })),
}));

describe("scanner settings repository", () => {
    beforeEach(() => {
        vi.resetModules();
        runAsync.mockReset();
        execAsync.mockReset();
        getAllAsync.mockReset();
    });

    it("creates the app settings table before use", async () => {
        const { initializeScannerSettings } = await import("@/lib/storage/scannerSettings.repository");

        await initializeScannerSettings();

        expect(execAsync).toHaveBeenCalledWith(expect.stringContaining("CREATE TABLE IF NOT EXISTS app_settings"));
    });

    it("returns the e2e fp32 model by default", async () => {
        getAllAsync.mockResolvedValueOnce([]);
        const { getSelectedDocScannerModelId } = await import("@/lib/storage/scannerSettings.repository");

        await expect(getSelectedDocScannerModelId()).resolves.toBe("docscanner-e2e-onnx");
    });

    it("persists the selected model id", async () => {
        const { setSelectedDocScannerModelId } = await import("@/lib/storage/scannerSettings.repository");

        await setSelectedDocScannerModelId("docscanner-fp32-onnx");

        expect(runAsync).toHaveBeenCalledWith(expect.stringContaining("INSERT OR REPLACE INTO app_settings"), ["docscanner_model_id", "docscanner-fp32-onnx"]);
    });

    it("migrates deprecated fp16 selection to the e2e model", async () => {
        getAllAsync.mockResolvedValueOnce([{ value: "docscanner-fp16-onnx" }]);
        const { getSelectedDocScannerModelId } = await import("@/lib/storage/scannerSettings.repository");

        await expect(getSelectedDocScannerModelId()).resolves.toBe("docscanner-e2e-onnx");
    });

    it("ignores unknown stored model ids", async () => {
        getAllAsync.mockResolvedValueOnce([{ value: "unknown-model" }]);
        const { getSelectedDocScannerModelId } = await import("@/lib/storage/scannerSettings.repository");

        await expect(getSelectedDocScannerModelId()).resolves.toBe("docscanner-e2e-onnx");
    });

    it("returns the default map long edge when nothing is stored", async () => {
        getAllAsync.mockResolvedValueOnce([]);
        const { getMaxProcessingLongEdge } = await import("@/lib/storage/scannerSettings.repository");

        await expect(getMaxProcessingLongEdge()).resolves.toBe(1920);
    });

    it("persists the map long edge preference", async () => {
        const { setMaxProcessingLongEdge } = await import("@/lib/storage/scannerSettings.repository");

        await setMaxProcessingLongEdge(1200);

        expect(runAsync).toHaveBeenCalledWith(expect.stringContaining("INSERT OR REPLACE INTO app_settings"), ["max_processing_long_edge", "1200"]);
    });

    it("ignores invalid stored map long edge values", async () => {
        getAllAsync.mockResolvedValueOnce([{ value: "99999" }]);
        const { getMaxProcessingLongEdge } = await import("@/lib/storage/scannerSettings.repository");

        await expect(getMaxProcessingLongEdge()).resolves.toBe(1920);
    });
});
