import type { DocScannerModelId, DocScannerModelOption } from '@/lib/model/docscannerModel.types';

export const DEFAULT_DOCSCANNER_MODEL_ID = 'docscanner-fp16-onnx' satisfies DocScannerModelId;

export const DOCSCANNER_MODEL_OPTIONS = [
  {
    id: 'docscanner-fp16-onnx',
    label: 'FP16',
    description: '19 MB · matches Python docscanner-fp16.onnx',
  },
  {
    id: 'docscanner-fp32-onnx',
    label: 'FP32',
    description: '35 MB · matches Python docscanner.onnx',
  },
] as const satisfies readonly DocScannerModelOption[];

export function getDocScannerModelOption(modelId: DocScannerModelId): DocScannerModelOption {
  const option = DOCSCANNER_MODEL_OPTIONS.find((entry) => entry.id === modelId);
  if (!option) {
    throw new Error(`Unknown DocScanner model: ${modelId}`);
  }
  return option;
}
