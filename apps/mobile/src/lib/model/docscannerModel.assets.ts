import docscannerE2eOnnx from '@/assets/models/docscanner-e2e.onnx';
import docscannerFp32Onnx from '@/assets/models/docscanner-fp32.onnx';
import type { DocScannerModelId } from '@/lib/model/docscannerModel.types';

export const DOCSCANNER_MODEL_ASSETS: Record<DocScannerModelId, number> = {
  'docscanner-e2e-onnx': docscannerE2eOnnx,
  'docscanner-fp32-onnx': docscannerFp32Onnx,
};
