# @pdfly/wasm

[qpdf](https://github.com/qpdf/qpdf) and **Ghostscript** in the browser or Node via WebAssembly: compress, split, merge, extract images, inspect, organize. Helpers include `compressPdf`, `optimizePdf`, `splitPdf`, `mergePdfs`, `extractImages`. Advanced API: `QpdfDocument` (see [`src/index.ts`](./src/index.ts)).

**PDF.js rasterisation** (full page → JPEG) lives in the sibling package **`@pdfly/pdf-render`**, not in this module.

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

In the web app, the compression tool now exposes both engines directly:

- `qpdf` stays the default lossless path
- `ghostscript` is available as the lossy rewrite path with image-oriented controls

## QPDF Scope

QPDF is a lossless PDF structural tool. It is a good fit for rewriting PDFs, object streams, flate recompression, linearization, inspection, validation, splitting, merging, and page organization. It does not resample or re-encode images, so it is not an aggressive lossy image compressor.

Omitted optimization options use the defaults in `OptimizeOptions` (see TypeScript types). Notably, **`objectStreams` defaults to `generate`**, which usually improves size by rewriting object streams; set **`preserve`** if you need output structure closer to the input (e.g. compatibility or structural diffs).

To render each PDF page to a JPEG via PDF.js, use **`@pdfly/pdf-render`**:

```ts
import { renderPdfPagesToJpg } from "@pdfly/pdf-render";
```

## Build from this monorepo

Pinned upstream sources are fetched inside the Docker build. From the repo root:

```bash
pnpm --filter @pdfly/wasm build
```

The default `build` path runs the optimized qpdf and Ghostscript Docker builds and then bundles the package. More context: [root README](https://github.com/MatteoGauthier/qpdf-wasm/blob/main/README.md).

The engine builds now run in parallel when you call:

```bash
pnpm --filter @pdfly/wasm build:wasm
```

If your Docker buildx driver supports local cache export, `tools/vendor/build.ts` also reuses a per-engine cache directory. You can override that cache location with:

```bash
PDFLY_DOCKER_CACHE_ROOT=.tmp/docker-buildx-cache pnpm --filter @pdfly/wasm build:wasm
```

Vendor sync is intentionally simple:

- pinned source archives live in `tools/vendor/upstreams.ts`
- Docker fetches those pinned archives during the build
- no manual clone or host-side vendor cache is required

```bash
pnpm --filter @pdfly/wasm test
pnpm --filter @pdfly/wasm validate
pnpm --filter @pdfly/wasm package:check
```

Useful collaborator commands:

```bash
pnpm --filter @pdfly/wasm build:qpdf:dev
pnpm --filter @pdfly/wasm build:qpdf:prd
pnpm --filter @pdfly/wasm build:ghostscript:dev
pnpm --filter @pdfly/wasm build:ghostscript:prd
```

Build-system contract:

- [`native/README.md`](./native/README.md)

`src/` — TS API; `tools/` — local orchestration and smoke helpers; `native/` — CMake, Emscripten bindings, and Docker build definitions; `dist/` — packaged output.

Runtime engine contract:

- both engines use an engine-local module loader under `src/engines/<engine>/module-loader.ts`
- both engines implement the same adapter shape under `src/engines/<engine>/engine.ts`
- `src/compression/*` owns the shared adapter contract and engine registry
- `src/runtime/wasmModule.loader.ts` owns the shared Emscripten loader pattern
- [`src/ARCHITECTURE.md`](./src/ARCHITECTURE.md) describes the directory contract

## Ghostscript WASM build

The Ghostscript engine is built with the same Docker-first model as qpdf.

From the repo root:

```bash
pnpm --filter @pdfly/wasm build:ghostscript:dev
```

That flow:

- uses `packages/pdfly-wasm/native/docker/ghostscript.Dockerfile`
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

This path is separate from the qpdf WASM build; both ship as artifacts under `build/` and are copied into `dist/` during `pnpm --filter @pdfly/wasm build:lib`.

You can then verify the artifact end to end with:

```bash
pnpm --filter @pdfly/wasm smoke:ghostscript \
  src/test/fixtures/pdfs/upstream/pdfium/rectangles.pdf \
  .tmp/ghostscript-smoke-rectangles.pdf \
  screen
```

That smoke path loads `ghostscript.js`, maps `ghostscript.wasm` with `locateFile(...)`, and calls the native `gsapi_*` rewrite wrapper that drives `pdfwrite` inside the WASM runtime.

## Release notes

Ghostscript is still an experimental engine in this package.

- `qpdf` is the smaller, lossless structural path
- `ghostscript` is the heavier, lossy rewrite path
- browser runtime and output quality are content-dependent

Observed behavior in this repo:

- `qpdf.wasm` is roughly `1 MB`
- `ghostscript.wasm` is materially larger at roughly `17 MB` in the packaged artifact
- Ghostscript can take several seconds on larger image-heavy PDFs, but usually saves much more space than qpdf on scans

## Licensing note

Ghostscript licensing is handled by Artifex and is not covered by the Apache-only terms that apply to the package-authored TypeScript code.

This published package includes bundled Ghostscript artifacts, so its package metadata is declared as:

- `(Apache-2.0 AND AGPL-3.0-or-later)`

- Artifex describes Ghostscript/GhostPDL as dual-licensed under `AGPLv3` or a commercial license
- their guidance also says SaaS / closed-source distribution cases generally require careful AGPL compliance review or a commercial license

Read the official pages before distributing a Ghostscript-enabled build:

- [Artifex licensing](https://artifex.com/licensing)
- [Ghostscript FAQ](https://ghostscript.com/faq/)
