export const DOCSCANNER_INPUT_SHAPE = [1, 3, 288, 288] as const;
export const DOCSCANNER_OUTPUT_SHAPE = [1, 2, 288, 288] as const;
export const DOCSCANNER_MODEL_VERSION = 'docscanner-fp16-onnx';
export const DOCSCANNER_TENSOR_LENGTH = 1 * 3 * 288 * 288;
export const DOCSCANNER_FLOW_LENGTH = 1 * 2 * 288 * 288;
