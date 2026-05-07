# @pdfly/wasm

[qpdf](https://github.com/qpdf/qpdf) in the browser or Node: compress, split, merge, extract images, PDF→JPG. Helpers: `compressPdf`, `splitPages`, `mergePdfs`, `extractImages`, `pdfToJpg`. Lower level: `QPDF`, `QPDFWriter` (see types / `src/index.ts`).

## Install

```bash
pnpm add @pdfly/wasm
# npm install @pdfly/wasm
```

Needs **Node 24+** for local dev ([`engines`](package.json)).

## Usage

```ts
import { compressPdf, mergePdfs, splitPages } from "@pdfly/wasm";

const input = await fetch("document.pdf").then((r) => r.arrayBuffer());
const compressed = await compressPdf(input, { compressionLevel: 9, decodeLevel: "all", recompressFlate: true });
const split = await splitPages(compressed.data);
const merged = await mergePdfs(split.pages);
```

Default **`objectStreams`** is **`generate`** for smaller files; use **`preserve`** if you need output closer to the input (see `CompressionOptions`).

Also: `initQpdf`, `getVersion`, `formatBytes`, `calculateSavings`, `downloadBuffer`, etc.

## Build from this monorepo

qpdf lives at repo root **`vendor/qpdf`**. From the repo root, with Emscripten + CMake on PATH:

```bash
git clone https://github.com/qpdf/qpdf.git vendor/qpdf
pnpm --filter @pdfly/wasm build
```

Emscripten: [emsdk](https://github.com/emscripten-core/emsdk). First WASM build may download ports — network once. More context: [root README](https://github.com/MatteoGauthier/qpdf-wasm/blob/main/README.md).

```bash
pnpm --filter @pdfly/wasm test
pnpm --filter @pdfly/wasm validate
```

`src/` — TS API; `wasm/` — CMake/Emscripten; `dist/` — tsdown output (includes `qpdf.js` / `qpdf.wasm`). All processing is local.
