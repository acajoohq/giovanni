import { DOCSCANNER_FLOW_LENGTH, DOCSCANNER_INPUT_SHAPE, DOCSCANNER_OUTPUT_SHAPE, DOCSCANNER_TENSOR_LENGTH } from "@/lib/scanner/scan.constants";

export function assertDocScannerInput(input: Float32Array): void {
    if (input.length !== DOCSCANNER_TENSOR_LENGTH) {
        throw new Error(`Expected DocScanner input ${DOCSCANNER_INPUT_SHAPE.join("x")} (${DOCSCANNER_TENSOR_LENGTH} values), got ${input.length}.`);
    }
}

export function assertDocScannerFlow(flow: Float32Array): void {
    if (flow.length !== DOCSCANNER_FLOW_LENGTH) {
        throw new Error(`Expected DocScanner output ${DOCSCANNER_OUTPUT_SHAPE.join("x")} (${DOCSCANNER_FLOW_LENGTH} values), got ${flow.length}.`);
    }
}
