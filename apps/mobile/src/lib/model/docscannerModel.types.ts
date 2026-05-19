export const DOCSCANNER_MODEL_IDS = ['docscanner-fp32-onnx', 'docscanner-fp16-onnx'] as const;

export type DocScannerModelId = (typeof DOCSCANNER_MODEL_IDS)[number];

export type DocScannerModelOption = {
  id: DocScannerModelId;
  label: string;
  description: string;
};

export function isDocScannerModelId(value: string): value is DocScannerModelId {
  return (DOCSCANNER_MODEL_IDS as readonly string[]).includes(value);
}
