import { NativeModules } from 'react-native';

import type { PreparedDocumentImage, RectifyFlowInput } from '@/lib/scanner/scan.types';

interface DocumentRectifierNativeModule {
  prepareInputTensor(sourceUri: string): Promise<{
    input: number[] | Float32Array;
    width: number;
    height: number;
  }>;
  remapAndSave(input: RectifyFlowInput): Promise<{ uri: string }>;
}

function getNativeModule(): DocumentRectifierNativeModule | null {
  return (NativeModules.DocumentRectifier as DocumentRectifierNativeModule | undefined) ?? null;
}

export async function prepareInputTensor(sourceUri: string): Promise<PreparedDocumentImage> {
  const nativeModule = getNativeModule();

  if (!nativeModule) {
    throw new Error('DocumentRectifier native module is not available in this build.');
  }

  const prepared = await nativeModule.prepareInputTensor(sourceUri);
  return {
    input:
      prepared.input instanceof Float32Array
        ? prepared.input
        : Float32Array.from(prepared.input),
    width: prepared.width,
    height: prepared.height,
  };
}

export async function remapAndSave(input: RectifyFlowInput): Promise<string> {
  const nativeModule = getNativeModule();

  if (!nativeModule) {
    throw new Error('DocumentRectifier native module is not available in this build.');
  }

  const result = await nativeModule.remapAndSave(input);
  return result.uri;
}
