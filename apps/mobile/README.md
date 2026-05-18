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
- The app loads `docscanner-fp16.ort` first and falls back to `docscanner-fp16.onnx`.
- The expected model input is `Float32Array [1, 3, 288, 288]`, RGB `[0, 1]`, CHW.
- The expected model output is `Float32Array [1, 2, 288, 288]`, a normalized backward-flow field.

The JavaScript pipeline calls a `DocumentRectifier` native bridge for tensor prep and full-resolution remapping. Until that native bridge is implemented in the development build, scans are stored with a fallback rectified image copied from the original and marked as `fallback`.

## License Note

The bundled DocScanner model comes from `/Users/matteolemni/dev/PeopleProjects/DocScanner`. That project license is non-commercial unless the upstream author grants commercial permission.

## Todo

- [ ] Reorganize codebase
- [ ] Add tests
- [ ] Make sure it works on iOS
- [ ] Put the nitro module in a dedicated monorepo package
- [ ] Make sure the Agents can easyly debug / work with the app / simulator
- [ ] Use skia for the comparison before / after
- [ ] List is broken
- [ ] Make sure we can choose which model to use
