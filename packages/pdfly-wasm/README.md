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

## Experimental Ghostscript WASM Build

The Ghostscript port is being built as a separate Docker-driven spike first, before any public JS API is added.

From the repo root:

```bash
git clone https://github.com/ArtifexSoftware/ghostpdl.git vendor/ghostpdl
pnpm --filter @pdfly/wasm build:ghostscript:dev
```

That flow:

- uses `packages/pdfly-wasm/wasm/docker/ghostscript.Dockerfile`
- keeps the Ghostscript build logic inside the Dockerfile
- installs autotools inside the container
- runs `autogen.sh`, `emconfigure ./configure`, and `emmake make`
- trims the build to the PDF-focused Ghostscript path by disabling `PCL` and `XPS`
- exports artifacts into `packages/pdfly-wasm/build/ghostscript`

Current target artifacts are:

- `ghostscript.js`
- `ghostscript.wasm`
- `config.log`
- `configaux.log`

This path is intentionally separate from the existing qpdf WASM build while the port is still being proven.

You can then verify the artifact end to end with:

```bash
pnpm --filter @pdfly/wasm smoke:ghostscript \
  src/test/fixtures/pdfs/upstream/pdfium/rectangles.pdf \
  .tmp/ghostscript-smoke-rectangles.pdf \
  screen
```

That smoke path loads `ghostscript.js`, maps `ghostscript.wasm` with `locateFile(...)`, writes the input PDF into MEMFS, runs `pdfwrite`, and writes the output PDF back to disk.
