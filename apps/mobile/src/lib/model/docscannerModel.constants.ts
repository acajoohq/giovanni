import type { DocScannerModelId, DocScannerModelOption } from '@/lib/model/docscannerModel.types';

export const DEFAULT_DOCSCANNER_MODEL_ID = 'docscanner-fp32-onnx' satisfies DocScannerModelId;

export const DOCSCANNER_MODEL_OPTIONS = [
  {
    id: 'docscanner-fp32-onnx',
    label: 'Reference FP32',
    sizeLabel: '35 MB',
    description: 'Python docscanner.onnx · same weights as PyTorch',
  },
  {
    id: 'docscanner-fp16-onnx',
    label: 'Mobile FP16',
    sizeLabel: '19 MB',
    description: 'Python docscanner-fp16.onnx · faster, tiny drift',
  },
] as const satisfies readonly DocScannerModelOption[];

export function getDocScannerModelOption(modelId: DocScannerModelId): DocScannerModelOption {
  const option = DOCSCANNER_MODEL_OPTIONS.find((entry) => entry.id === modelId);
  if (!option) {
    throw new Error(`Unknown DocScanner model: ${modelId}`);
  }
  return option;
}
