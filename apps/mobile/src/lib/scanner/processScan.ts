import { getDocScannerModelMode } from '@/lib/model/docscannerModel.constants';
import type { ProcessScanResult, ScanSource, ScanTiming } from '@/lib/scanner/scan.types';
import { measureStep, totalTiming } from '@/lib/scanner/timing';
import {
  prepareE2eInputTensor,
  prepareInputTensor,
  remapAndSave,
  saveRectifiedTensor,
} from '@/lib/native/documentRectifier';
import {
  getMaxProcessingLongEdge,
  getSelectedDocScannerModelId,
} from '@/lib/storage/scannerSettings.repository';
import {
  copyFallbackRectifiedImage,
  copyOriginalImage,
  getRectifiedImageUri,
} from '@/lib/storage/scanFiles';
import { insertScan } from '@/lib/storage/scans.repository';

function createScanId(): string {
  return `scan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function processScan(sourceUri: string, source: ScanSource): Promise<ProcessScanResult> {
  const timings: ScanTiming[] = [];
  const scanId = createScanId();
  const originalUri = await measureStep('copy original', timings, () =>
    copyOriginalImage(sourceUri, scanId),
  );

  let rectifiedUri = '';
  let width: number | null = null;
  let height: number | null = null;
  let warning: string | null = null;

  const modelId = await getSelectedDocScannerModelId();
  const modelMode = getDocScannerModelMode(modelId);
  const maxProcessingLongEdge = await getMaxProcessingLongEdge();

  try {
    if (modelMode === 'e2e') {
      const prepared = await measureStep('prepare e2e tensor', timings, () =>
        prepareE2eInputTensor(originalUri, maxProcessingLongEdge),
      );
      width = prepared.width;
      height = prepared.height;

      const { runDocScannerE2e } = await import('@/lib/model/docscannerModel');
      const rectified = await measureStep('onnx inference', timings, () =>
        runDocScannerE2e(prepared.input, prepared.width, prepared.height, modelId),
      );

      rectifiedUri = await measureStep('save rectified', timings, () =>
        saveRectifiedTensor({
          tensor: rectified,
          outputUri: getRectifiedImageUri(scanId),
          width: prepared.width,
          height: prepared.height,
        }),
      );
    } else {
      const prepared = await measureStep('prepare tensor', timings, () =>
        prepareInputTensor(originalUri, maxProcessingLongEdge),
      );
      width = prepared.width;
      height = prepared.height;

      const { runDocScannerFlow } = await import('@/lib/model/docscannerModel');
      const flow = await measureStep('onnx inference', timings, () =>
        runDocScannerFlow(prepared.input, modelId),
      );

      rectifiedUri = await measureStep('native remap', timings, () =>
        remapAndSave({
          sourceUri: originalUri,
          outputUri: getRectifiedImageUri(scanId),
          width: prepared.width,
          height: prepared.height,
          flow,
          maxProcessingLongEdge,
        }),
      );
    }
  } catch (error) {
    warning = error instanceof Error ? error.message : 'Rectification failed.';
    rectifiedUri = await measureStep('fallback copy', timings, () =>
      copyFallbackRectifiedImage(originalUri, scanId),
    );
  }

  const scan = {
    id: scanId,
    source,
    status: warning ? 'fallback' : 'processed',
    createdAt: new Date().toISOString(),
    originalUri,
    rectifiedUri,
    width,
    height,
    processingMs: totalTiming(timings),
    modelVersion: modelId,
    warning,
  } as const;

  await measureStep('save metadata', timings, () => insertScan(scan));

  return { scan, timings };
}
