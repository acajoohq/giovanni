# Core API Overview

These endpoints are exported by `@acajoo/giovanni-core` and represent the primary task-oriented API surface.

## Import

```ts
import {
  compressPdf,
  getAvailableCompressionEngines,
  initCompressionEngine,
  inspectPdf,
  checkPdf,
  splitPdf,
  mergePdfs,
  organizePdf,
  watermarkPdf,
  extractImages,
} from "@acajoo/giovanni-core";
```

## Endpoints

- [Compression](/core-api/compress)
- [Inspect and Check](/core-api/inspect-check)
- [Split](/core-api/split)
- [Merge](/core-api/merge)
- [Organize](/core-api/organize)
- [Watermark](/core-api/watermark)
- [Extract Images](/core-api/extract-images)

## Shared Input Type

Most endpoints accept `Uint8Array | ArrayBuffer` as PDF input.

```ts
type PdfInput = Uint8Array | ArrayBuffer;
```

## Runtime-Specific Endpoints

For runtime bridge contracts (React Native JSI and native C FFI), see:

- [Runtime Endpoints Overview](/runtime-endpoints/)
- [React Native JSI Endpoints](/runtime-endpoints/jsi)
- [Native C Endpoints](/runtime-endpoints/native-c)