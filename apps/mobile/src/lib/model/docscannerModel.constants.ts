import type { DocScannerModelId, DocScannerModelMode, DocScannerModelOption } from '@/lib/model/docscannerModel.types';

export const DEFAULT_DOCSCANNER_MODEL_ID = 'docscanner-e2e-onnx' satisfies DocScannerModelId;

export const DOCSCANNER_MODEL_OPTIONS = [
  {
    id: 'docscanner-e2e-onnx',
    label: 'E2E FP32',
    sizeLabel: '35 MB',
    description: 'Python docscanner-e2e.onnx · image in → rectified out',
    mode: 'e2e',
  },
  {
    id: 'docscanner-fp32-onnx',
    label: 'Flow FP32',
    sizeLabel: '35 MB',
    description: 'Python docscanner.onnx · flow field + native warp',
    mode: 'flow',
  },
] as const satisfies readonly DocScannerModelOption[];

export function getDocScannerModelMode(modelId: DocScannerModelId): DocScannerModelMode {
  const option = getDocScannerModelOption(modelId);
  return option.mode;
}

export function getDocScannerModelOption(modelId: DocScannerModelId): DocScannerModelOption {
  const option = DOCSCANNER_MODEL_OPTIONS.find((entry) => entry.id === modelId);
  if (!option) {
    throw new Error(`Unknown DocScanner model: ${modelId}`);
  }
  return option;
}
