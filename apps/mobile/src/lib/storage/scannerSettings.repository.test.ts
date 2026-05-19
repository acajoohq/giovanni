import { beforeEach, describe, expect, it, vi } from 'vitest';

const runAsync = vi.fn();
const execAsync = vi.fn();
const getAllAsync = vi.fn();

vi.mock('expo-sqlite', () => ({
  openDatabaseAsync: vi.fn(async () => ({
    execAsync,
    getAllAsync,
    runAsync,
  })),
}));

describe('scanner settings repository', () => {
  beforeEach(() => {
    vi.resetModules();
    runAsync.mockReset();
    execAsync.mockReset();
    getAllAsync.mockReset();
  });

  it('creates the app settings table before use', async () => {
    const { initializeScannerSettings } = await import('@/lib/storage/scannerSettings.repository');

    await initializeScannerSettings();

    expect(execAsync).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS app_settings'));
  });

  it('returns the default model when nothing is stored', async () => {
    getAllAsync.mockResolvedValueOnce([]);
    const { getSelectedDocScannerModelId } = await import('@/lib/storage/scannerSettings.repository');

    await expect(getSelectedDocScannerModelId()).resolves.toBe('docscanner-fp16-onnx');
  });

  it('persists the selected model id', async () => {
    const { setSelectedDocScannerModelId } = await import('@/lib/storage/scannerSettings.repository');

    await setSelectedDocScannerModelId('docscanner-fp32-onnx');

    expect(runAsync).toHaveBeenCalledWith(expect.stringContaining('INSERT OR REPLACE INTO app_settings'), [
      'docscanner_model_id',
      'docscanner-fp32-onnx',
    ]);
  });

  it('ignores unknown stored model ids', async () => {
    getAllAsync.mockResolvedValueOnce([{ value: 'unknown-model' }]);
    const { getSelectedDocScannerModelId } = await import('@/lib/storage/scannerSettings.repository');

    await expect(getSelectedDocScannerModelId()).resolves.toBe('docscanner-fp16-onnx');
  });
});
