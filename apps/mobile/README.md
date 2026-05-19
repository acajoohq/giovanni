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
- The scan screen **model picker** compares the two Python ONNX exports from [DocScanner](https://github.com/fh2019ustc/DocScanner) (local fork):
  - **E2E FP32** (default) — `docscanner-e2e.onnx` (35 MB). Full pipeline in ONNX: image in → rectified out. Matches `uv run infer_onnx.py --model docscanner-e2e.onnx`.
  - **Flow FP32** — `docscanner-fp32.onnx` (35 MB). Flow field at 288×288 + native warp. Matches `--model docscanner.onnx`.
- Do not use fp16/int8 for quality work; the DocScanner fork documents visible quality loss.

### E2E I/O contract

- **Input:** `Float32Array [1, 3, H, W]` — full-resolution RGB in `[0, 1]`, CHW, no normalization (max long edge 2400).
- **Output:** `Float32Array [1, 3, H, W]` — rectified RGB in `[0, 1]`.

### Flow I/O contract (legacy)

- **Input:** `Float32Array [1, 3, 288, 288]`
- **Output:** `Float32Array [1, 2, 288, 288]` backward-flow field — warped natively via `react-native-document-rectifier`.

## License Note

The bundled DocScanner model comes from `/Users/matteolemni/dev/PeopleProjects/DocScanner`. That project license is non-commercial unless the upstream author grants commercial permission.
