import { Asset } from 'expo-asset';
import { InferenceSession, Tensor } from 'onnxruntime-react-native';

import docscannerFp16Onnx from '@/assets/models/docscanner-fp16.onnx';
import {
  DOCSCANNER_FLOW_LENGTH,
  DOCSCANNER_INPUT_SHAPE,
} from '@/lib/scanner/scan.constants';
import { assertDocScannerFlow, assertDocScannerInput } from '@/lib/scanner/shapeValidation';

let sessionPromise: Promise<InferenceSession> | null = null;

async function getAssetUri(moduleId: number): Promise<string> {
  const asset = Asset.fromModule(moduleId);
  await asset.downloadAsync();
  return asset.localUri ?? asset.uri;
}

async function createSessionFromAsset(moduleId: number): Promise<InferenceSession> {
  const uri = await getAssetUri(moduleId);

  return InferenceSession.create(uri, {
    executionProviders: ['xnnpack', 'cpu'],
    graphOptimizationLevel: 'all',
    executionMode: 'sequential',
    enableMemPattern: true,
    enableCpuMemArena: true,
  });
}

export async function getDocScannerSession(): Promise<InferenceSession> {
  sessionPromise ??= createSessionFromAsset(docscannerFp16Onnx);

  return sessionPromise;
}

export async function runDocScanner(input: Float32Array): Promise<Float32Array> {
  assertDocScannerInput(input);

  const session = await getDocScannerSession();
  const inputName = session.inputNames[0];

  if (!inputName) {
    throw new Error('DocScanner ONNX session has no input name.');
  }

  const feeds = {
    [inputName]: new Tensor('float32', input, [...DOCSCANNER_INPUT_SHAPE]),
  };
  const results = await session.run(feeds);
  const outputName = session.outputNames[0] ?? Object.keys(results)[0];
  const output = outputName ? results[outputName] : undefined;

  if (!output || !(output.data instanceof Float32Array)) {
    throw new Error('DocScanner ONNX session did not return a Float32Array flow field.');
  }

  const flow = output.data.length === DOCSCANNER_FLOW_LENGTH ? output.data : new Float32Array(output.data);
  assertDocScannerFlow(flow);
  return flow;
}
