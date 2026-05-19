import docscannerFp16Onnx from '@/assets/models/docscanner-fp16.onnx';
import docscannerFp32Onnx from '@/assets/models/docscanner-fp32.onnx';
import type { DocScannerModelId } from '@/lib/model/docscannerModel.types';

export const DOCSCANNER_MODEL_ASSETS: Record<DocScannerModelId, number> = {
  'docscanner-fp16-onnx': docscannerFp16Onnx,
  'docscanner-fp32-onnx': docscannerFp32Onnx,
};
