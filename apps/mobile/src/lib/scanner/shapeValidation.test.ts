import { describe, expect, it } from 'vitest';

import {
  DOCSCANNER_FLOW_LENGTH,
  DOCSCANNER_TENSOR_LENGTH,
} from '@/lib/scanner/scan.constants';
import { assertDocScannerFlow, assertDocScannerInput } from '@/lib/scanner/shapeValidation';

describe('DocScanner tensor validation', () => {
  it('accepts the model input shape', () => {
    expect(() => assertDocScannerInput(new Float32Array(DOCSCANNER_TENSOR_LENGTH))).not.toThrow();
  });

  it('rejects malformed model input tensors', () => {
    expect(() => assertDocScannerInput(new Float32Array(DOCSCANNER_TENSOR_LENGTH - 1))).toThrow(
      'Expected DocScanner input',
    );
  });

  it('accepts the flow output shape', () => {
    expect(() => assertDocScannerFlow(new Float32Array(DOCSCANNER_FLOW_LENGTH))).not.toThrow();
  });

  it('rejects malformed flow outputs', () => {
    expect(() => assertDocScannerFlow(new Float32Array(DOCSCANNER_FLOW_LENGTH - 1))).toThrow(
      'Expected DocScanner output',
    );
  });
});
