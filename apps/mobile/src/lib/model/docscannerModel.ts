import { Asset } from "expo-asset";
import { InferenceSession, Tensor } from "onnxruntime-react-native";

import { DOCSCANNER_MODEL_ASSETS } from "@/lib/model/docscannerModel.assets";
import type { DocScannerModelId } from "@/lib/model/docscannerModel.types";
import { DOCSCANNER_FLOW_LENGTH, DOCSCANNER_INPUT_SHAPE } from "@/lib/scanner/scan.constants";
import { assertDocScannerFlow, assertDocScannerInput } from "@/lib/scanner/shapeValidation";

let activeModelId: DocScannerModelId | null = null;
let sessionPromise: Promise<InferenceSession> | null = null;

async function getAssetUri(moduleId: number): Promise<string> {
    const asset = Asset.fromModule(moduleId);
    await asset.downloadAsync();
    return asset.localUri ?? asset.uri;
}

async function createSessionFromAsset(moduleId: number): Promise<InferenceSession> {
    const uri = await getAssetUri(moduleId);

    return InferenceSession.create(uri, {
        executionProviders: ["xnnpack", "cpu"],
        graphOptimizationLevel: "all",
        executionMode: "sequential",
        enableMemPattern: true,
        enableCpuMemArena: true,
    });
}

export function invalidateDocScannerSession(): void {
    activeModelId = null;
    sessionPromise = null;
}

export async function getDocScannerSession(modelId: DocScannerModelId): Promise<InferenceSession> {
    if (activeModelId !== modelId) {
        invalidateDocScannerSession();
        activeModelId = modelId;
    }

    sessionPromise ??= createSessionFromAsset(DOCSCANNER_MODEL_ASSETS[modelId]);

    return sessionPromise;
}

export async function runDocScannerFlow(input: Float32Array, modelId: DocScannerModelId): Promise<Float32Array> {
    assertDocScannerInput(input);

    const session = await getDocScannerSession(modelId);
    const inputName = session.inputNames[0];

    if (!inputName) {
        throw new Error("DocScanner ONNX session has no input name.");
    }

    const feeds = {
        [inputName]: new Tensor("float32", input, [...DOCSCANNER_INPUT_SHAPE]),
    };
    const results = await session.run(feeds);
    const outputName = session.outputNames[0] ?? Object.keys(results)[0];
    const output = outputName ? results[outputName] : undefined;

    if (!output || !(output.data instanceof Float32Array)) {
        throw new Error("DocScanner ONNX session did not return a Float32Array flow field.");
    }

    const flow = output.data.length === DOCSCANNER_FLOW_LENGTH ? output.data : new Float32Array(output.data);
    assertDocScannerFlow(flow);
    return flow;
}

export async function runDocScannerE2e(input: Float32Array, width: number, height: number, modelId: DocScannerModelId): Promise<Float32Array> {
    const expectedLength = width * height * 3;
    if (input.length !== expectedLength) {
        throw new Error(`Expected DocScanner E2E input [1, 3, ${height}, ${width}] (${expectedLength} values), got ${input.length}.`);
    }

    const session = await getDocScannerSession(modelId);
    const inputName = session.inputNames[0];

    if (!inputName) {
        throw new Error("DocScanner E2E ONNX session has no input name.");
    }

    const feeds = {
        [inputName]: new Tensor("float32", input, [1, 3, height, width]),
    };
    const results = await session.run(feeds);
    const outputName = session.outputNames[0] ?? Object.keys(results)[0];
    const output = outputName ? results[outputName] : undefined;

    if (!output || !(output.data instanceof Float32Array)) {
        throw new Error("DocScanner E2E ONNX session did not return a Float32Array image.");
    }

    const rectified = output.data.length === expectedLength ? output.data : new Float32Array(output.data);

    if (rectified.length !== expectedLength) {
        throw new Error(`Expected DocScanner E2E output [1, 3, ${height}, ${width}] (${expectedLength} values), got ${rectified.length}.`);
    }

    return rectified;
}
