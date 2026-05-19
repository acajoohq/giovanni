/** Matches `CommonResolutions.FHD_4_3` used for photo capture. */
export const CAMERA_PREVIEW_ASPECT_RATIO = 4 / 3;

export const DOCSCANNER_INPUT_SHAPE = [1, 3, 288, 288] as const;
export const DOCSCANNER_OUTPUT_SHAPE = [1, 2, 288, 288] as const;
export const DOCSCANNER_TENSOR_LENGTH = 1 * 3 * 288 * 288;
export const DOCSCANNER_FLOW_LENGTH = 1 * 2 * 288 * 288;
