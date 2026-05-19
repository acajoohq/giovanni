import { getDocumentRectifier } from "react-native-document-rectifier";

import type { PreparedDocumentImage, RectifyFlowInput, SaveRectifiedTensorInput } from "@/lib/scanner/scan.types";

export async function prepareInputTensor(sourceUri: string, maxProcessingLongEdge: number): Promise<PreparedDocumentImage> {
    const rectifier = getDocumentRectifier();
    const prepared = await rectifier.prepareInputTensor(sourceUri, maxProcessingLongEdge);

    return {
        input: new Float32Array(prepared.tensorBuffer),
        width: prepared.width,
        height: prepared.height,
    };
}

export async function prepareE2eInputTensor(sourceUri: string, maxProcessingLongEdge: number): Promise<PreparedDocumentImage> {
    const rectifier = getDocumentRectifier();
    const prepared = await rectifier.prepareE2eInputTensor(sourceUri, maxProcessingLongEdge);

    return {
        input: new Float32Array(prepared.tensorBuffer),
        width: prepared.width,
        height: prepared.height,
    };
}

export async function remapAndSave(input: RectifyFlowInput): Promise<string> {
    const rectifier = getDocumentRectifier();
    const flowBuffer = toExactArrayBuffer(input.flow);
    const result = await rectifier.remapAndSave(input.sourceUri, input.outputUri, input.width, input.height, flowBuffer, input.maxProcessingLongEdge);
    return result.uri;
}

export async function saveRectifiedTensor(input: SaveRectifiedTensorInput): Promise<string> {
    const rectifier = getDocumentRectifier();
    const tensorBuffer = toExactArrayBuffer(input.tensor);
    const result = await rectifier.saveRectifiedTensor(tensorBuffer, input.outputUri, input.width, input.height);
    return result.uri;
}

function toExactArrayBuffer(value: Float32Array): ArrayBuffer {
    const { buffer, byteLength, byteOffset } = value;

    if (byteOffset === 0 && byteLength === buffer.byteLength && buffer instanceof ArrayBuffer) {
        return buffer;
    }

    return buffer.slice(byteOffset, byteOffset + byteLength) as ArrayBuffer;
}
