export const DOCSCANNER_MODEL_IDS = ['docscanner-e2e-onnx', 'docscanner-fp32-onnx'] as const;

export type DocScannerModelId = (typeof DOCSCANNER_MODEL_IDS)[number];

export type DocScannerModelMode = 'e2e' | 'flow';

export type DocScannerModelOption = {
  id: DocScannerModelId;
  label: string;
  sizeLabel: string;
  description: string;
  mode: DocScannerModelMode;
};

export function isDocScannerModelId(value: string): value is DocScannerModelId {
  return (DOCSCANNER_MODEL_IDS as readonly string[]).includes(value);
}
