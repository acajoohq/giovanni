# @pdfly/wasm

[qpdf](https://github.com/qpdf/qpdf) in the browser or Node: compress, split, merge, extract images, PDF→JPG. Helpers: `compressPdf`, `splitPages`, `mergePdfs`, `extractImages`, `pdfToJpg`. Lower level: `QPDF`, `QPDFWriter` (see types / `src/index.ts`).

## Install

```bash
pnpm add @pdfly/wasm
# npm install @pdfly/wasm
```

Needs **Node 24+** for local dev ([`engines`](package.json)). Docker is the build toolchain for the vendored WASM engines. On Windows, use Docker Desktop with Linux containers enabled.

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

Engine-aware compression is also available:

```ts
import { compressPdf } from "@pdfly/wasm";

const qpdfResult = await compressPdf(input, {
    engine: "qpdf",
    preset: "web",
});

const ghostscriptResult = await compressPdf(input, {
    engine: "ghostscript",
    preset: "screen",
    colorImageResolution: 96,
    jpegQuality: 75,
});
```

## QPDF Scope

QPDF is a lossless PDF structural tool. It is a good fit for rewriting PDFs, object streams, flate recompression, linearization, inspection, validation, splitting, merging, and page organization. It does not resample or re-encode images, so it is not an aggressive lossy image compressor.

Omitted optimization options use the defaults in `OptimizeOptions` (see TypeScript types). Notably, **`objectStreams` defaults to `generate`**, which usually improves size by rewriting object streams; set **`preserve`** if you need output structure closer to the input (e.g. compatibility or structural diffs).

PDF.js-backed page rendering is intentionally separate from the main QPDF API:

```ts
import { renderPdfPagesToJpg } from "@pdfly/wasm/render";
```

## Build from this monorepo

Pinned upstream sources are fetched inside the Docker build. From the repo root:

```bash
pnpm --filter @pdfly/wasm build
```

The default `build` path runs the optimized qpdf and Ghostscript Docker builds and then bundles the package. More context: [root README](https://github.com/MatteoGauthier/qpdf-wasm/blob/main/README.md).

Vendor sync is intentionally simple:

- pinned source archives live in `tools/vendor/upstreams.ts`
- Docker fetches those pinned archives during the build
- no manual clone or host-side vendor cache is required

```bash
pnpm --filter @pdfly/wasm test
pnpm --filter @pdfly/wasm validate
```

Useful collaborator commands:

```bash
pnpm --filter @pdfly/wasm build:qpdf:dev
pnpm --filter @pdfly/wasm build:qpdf:prd
pnpm --filter @pdfly/wasm build:ghostscript:dev
pnpm --filter @pdfly/wasm build:ghostscript:prd
```

Build-system contract:

- [`vendor-build/README.md`](./vendor-build/README.md)

`src/` — TS API; `tools/` — local orchestration and smoke helpers; `vendor-build/` — native/container build definitions; `dist/` — packaged output.

Runtime engine contract:

- both engines use an engine-local module loader under `src/core/<engine>/module-loader.ts`
- both engines implement the same adapter shape under `src/core/<engine>/engine.ts`
- `src/core/compression/*` owns the shared adapter contract and engine registry
- `src/core/shared/wasm-loader.ts` owns the shared Emscripten loader pattern
- [`src/core/README.md`](./src/core/README.md) describes the directory contract

## Experimental Ghostscript WASM Build

The Ghostscript port is being built as a separate Docker-driven spike first, before any public JS API is added.

From the repo root:

```bash
pnpm --filter @pdfly/wasm build:ghostscript:dev
```

That flow:

- uses `packages/pdfly-wasm/vendor-build/docker/ghostscript.Dockerfile`
- uses a pinned `ghostpdl` source archive fetched inside Docker
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
