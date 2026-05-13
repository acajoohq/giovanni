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
import { inspectPdf, optimizePdf, splitPdf } from "@pdfly/wasm";

const input = await fetch("document.pdf").then((response) => response.arrayBuffer());

const info = await inspectPdf(input);

const optimized = await optimizePdf(input, {
    preset: "web", // default | web | archive
    linearize: true,
});

const pages = await splitPdf(optimized.data);
```

## QPDF Scope

QPDF is a lossless PDF structural tool. It is a good fit for rewriting PDFs, object streams, flate recompression, linearization, inspection, validation, splitting, merging, and page organization. It does not resample or re-encode images, so it is not an aggressive lossy image compressor.

Omitted optimization options use the defaults in `OptimizeOptions` (see TypeScript types). Notably, **`objectStreams` defaults to `generate`**, which usually improves size by rewriting object streams; set **`preserve`** if you need output structure closer to the input (e.g. compatibility or structural diffs).

PDF.js-backed page rendering is intentionally separate from the main QPDF API:

```ts
import { renderPdfPagesToJpg } from "@pdfly/wasm/render";
```

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
