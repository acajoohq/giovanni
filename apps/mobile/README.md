# Doc Scanner Mobile

Expo SDK 56 prototype for local document scanning and before/after review.

## Commands

```bash
pnpm --dir apps/mobile run dev
pnpm --dir apps/mobile run ios
pnpm --dir apps/mobile run android
pnpm --dir apps/mobile run typecheck
pnpm --dir apps/mobile run lint
pnpm --dir apps/mobile run test
```

This app uses native packages, so use a development build instead of Expo Go.

## Model Pipeline

- Model assets live in `assets/models/`.
- The app ships both `docscanner-fp16.onnx` (19 MB, default) and `docscanner-fp32.onnx` (35 MB). Use the **ONNX model** picker on the scan screen to switch between them when comparing against the Python reference.
- The expected model input is `Float32Array [1, 3, 288, 288]`, RGB `[0, 1]`, CHW.
- The expected model output is `Float32Array [1, 2, 288, 288]`, a normalized backward-flow field.

The JavaScript pipeline calls the workspace `react-native-document-rectifier` Nitro package for tensor prep and full-resolution remapping. ONNX inference stays in JavaScript for v1 through `onnxruntime-react-native`.

## License Note

The bundled DocScanner model comes from `/Users/matteolemni/dev/PeopleProjects/DocScanner`. That project license is non-commercial unless the upstream author grants commercial permission.
