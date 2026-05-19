import type { HybridObject } from 'react-native-nitro-modules';

export interface TensorPrepResult {
  width: number;
  height: number;
  tensorBuffer: ArrayBuffer;
}

export interface RectifyResult {
  uri: string;
  width: number;
  height: number;
  processingWidth: number;
  processingHeight: number;
}

export interface DocumentRectifier
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  prepareInputTensor(sourceUri: string, maxProcessingLongEdge: number): Promise<TensorPrepResult>;
  prepareE2eInputTensor(
    sourceUri: string,
    maxProcessingLongEdge: number,
  ): Promise<TensorPrepResult>;
  remapAndSave(
    sourceUri: string,
    outputUri: string,
    width: number,
    height: number,
    flowBuffer: ArrayBuffer,
    maxProcessingLongEdge: number,
  ): Promise<RectifyResult>;
  saveRectifiedTensor(
    tensorBuffer: ArrayBuffer,
    outputUri: string,
    width: number,
    height: number,
  ): Promise<RectifyResult>;
}
