# @giovanni/core

[qpdf](https://github.com/qpdf/qpdf) built for multiple runtimes — compress, split, merge, extract images, inspect, and organize PDFs across WebAssembly (browser and Node.js), native C FFI, and React Native JSI targets. Experimental **Ghostscript** support adds lossy image recompression. The root package is task-oriented; engine-specific APIs live under `@giovanni/core/qpdf` and `@giovanni/core/ghostscript`.

**PDF.js rasterisation** (full page → JPEG) lives in the sibling package **`@giovanni/pdf-render`**, not in this module.

## Install

```bash
pnpm add @giovanni/core
# npm install @giovanni/core
```

Needs **Node 24+** for local dev ([`engines`](package.json)). Docker is the build toolchain for the vendored WASM engines. On Windows, use Docker Desktop with Linux containers enabled.

## Usage

```ts
import { compressPdf, inspectPdf, splitPdf } from "@giovanni/core";

const input = await fetch("document.pdf").then((r) => r.arrayBuffer());

const info = await inspectPdf(input);

const compressed = await compressPdf(input, {
    preset: "web", // default | web | archive
    linearize: true,
});

const pages = await splitPdf(compressed.data);
```

Engine-specific entrypoints are available via subpath imports:

```ts
import { compressPdf } from "@giovanni/core";
import { optimizePdf, QpdfDocument } from "@giovanni/core/qpdf";
import { compressPdfWithGhostscript } from "@giovanni/core/ghostscript";

const qpdfResult = await compressPdf(input, { engine: "qpdf", preset: "web" });

const ghostscriptResult = await compressPdf(input, {
    engine: "ghostscript",
    preset: "screen",
    colorImageResolution: 96,
    jpegQuality: 75,
});

const optimized = await optimizePdf(input, { preset: "archive" });
const document = await QpdfDocument.open(optimized.data);
document.dispose();

const screenResult = await compressPdfWithGhostscript(input, { preset: "screen" });
```

## Engines

### QPDF

QPDF is a lossless PDF structural tool. It handles: object stream rewriting, flate recompression, linearization, inspection, validation, splitting, merging, and page organization. It does not resample or re-encode images, so it is not a lossy image compressor.

Omitted optimization options fall back to `OptimizeOptions` defaults. Notably **`objectStreams` defaults to `generate`**, which usually improves size by rewriting object streams; set **`preserve`** if you need output structure closer to the input (e.g. for compatibility or structural diffs).

To render PDF pages to JPEG via PDF.js, use the sibling package:

```ts
import { renderPdfPagesToJpg } from "@giovanni/pdf-render";
```

### Ghostscript

Ghostscript is the lossy rewrite path. It re-encodes images and rewrites the entire PDF through the `pdfwrite` device, which can recover much more space than qpdf on scan-heavy documents.

> **Experimental.** Ghostscript is not yet considered stable in this package.

Observed behavior in this repo:

- `qpdf.wasm` ≈ 1 MB — fast, lossless structural rewrites
- `ghostscript.wasm` ≈ 17 MB — slower; can save significantly more on image-heavy PDFs
- Processing time for larger scanned PDFs can reach several seconds

**Licensing:** Ghostscript is dual-licensed under AGPLv3 or a commercial license by Artifex. This package's metadata reflects `(Apache-2.0 AND AGPL-3.0-or-later)`. SaaS and closed-source distribution likely require careful AGPL compliance review or a commercial license. Read the official pages before distributing a Ghostscript-enabled build:

- [Artifex licensing](https://artifex.com/licensing)
- [Ghostscript FAQ](https://ghostscript.com/faq/)

## Building

### WASM (web / Node.js)

Requires **Docker Desktop** (Linux containers). Pinned source archives are fetched inside the container — no manual vendor clone needed.

```bash
# Full build (WASM + bundle)
pnpm --filter @giovanni/core build

# WASM engines only (parallel)
pnpm --filter @giovanni/core build:wasm

# Individual engine builds
pnpm --filter @giovanni/core build:qpdf:dev
pnpm --filter @giovanni/core build:qpdf:prd
pnpm --filter @giovanni/core build:ghostscript:dev
pnpm --filter @giovanni/core build:ghostscript:prd
```

If your Docker buildx driver supports local cache export, the build reuses a per-engine cache directory. Override the cache location with:

```bash
GIOVANNI_DOCKER_CACHE_ROOT=.tmp/docker-buildx-cache pnpm --filter @giovanni/core build:wasm
```

Vendor sync contract:

- Pinned source archives are declared in `tools/vendor/upstreams.ts`
- Docker fetches those archives during the build
- No manual host-side vendor cache is required

### C FFI (native)

Produces `libgiovanni_native` (static by default) and a C header `giovanni_c.h`. Requires **CMake** and a **C++20 compiler** — no Docker needed.

```bash
pnpm --filter @giovanni/core build:native
```

Output lands in `build/native/`.

```c
#include "giovanni_c.h"

GiovanniQpdfHandle h = giovanni_qpdf_create();
// ... giovanni_write_pdf, giovanni_split_pages, giovanni_merge_pdfs ...
giovanni_qpdf_destroy(h);
```

Usable from Python, Rust, Go, Swift, or any language with a C FFI. Build as a shared library instead of static:

```bash
GIOVANNI_NATIVE_SHARED=1 pnpm --filter @giovanni/core build:native
```

### React Native (JSI)

Produces `libgiovanni_jsi` (shared library) that registers a synchronous `giovanni` object on the JSI runtime, exposing `getVersion`, `writePdf`, `splitPages`, `mergePdfs`, and `getDocumentInfo`.

```bash
# Point to your ReactCommon directory (contains jsi/jsi.h)
GIOVANNI_JSI_INCLUDE_DIR=/path/to/node_modules/react-native/ReactCommon \
  pnpm --filter @giovanni/core build:jsi
```

Output lands in `build/jsi/`. If `GIOVANNI_JSI_INCLUDE_DIR` is not set, the build compiles a stub-only fallback without the JSI runtime dependency.

### Build all native targets

```bash
pnpm --filter @giovanni/core build:native:all
```

### Build environment variables

| Variable                     | Applies to     | Description                            |
| ---------------------------- | -------------- | -------------------------------------- |
| `GIOVANNI_DOCKER_CACHE_ROOT` | WASM builds    | Override Docker buildx cache directory |
| `GIOVANNI_NATIVE_SHARED=1`   | `build:native` | Build shared library instead of static |
| `GIOVANNI_JSI_INCLUDE_DIR`   | `build:jsi`    | Path to `ReactCommon/` (JSI headers)   |
| `GIOVANNI_NATIVE_JOBS`       | native / JSI   | Parallel CMake build jobs (default: 4) |

## Development

```bash
pnpm --filter @giovanni/core test
pnpm --filter @giovanni/core validate
pnpm --filter @giovanni/core package:check
```

Smoke test the Ghostscript WASM artifact end to end:

```bash
pnpm --filter @giovanni/core smoke:ghostscript \
  src/test/fixtures/pdfs/upstream/pdfium/rectangles.pdf \
  .tmp/ghostscript-smoke-rectangles.pdf \
  screen
```

Directory layout:

```
src/        TypeScript API
tools/      Build orchestration and smoke helpers
native/     CMake sources, Emscripten bindings, Dockerfiles
dist/       Packaged output (generated)
build/      WASM and native artifacts (generated)
```

Architecture references:

- [`native/README.md`](./native/README.md) — C++ native layer (interface → impl → targets)

Native source layout:

```
native/
  interface/   Abstract C++ interfaces (IQpdfEngine, IGhostscriptEngine)
  impl/        Platform-agnostic implementations (QpdfEngine via libqpdf)
  targets/
    native/    C FFI wrapper (giovanni_c.h + libgiovanni_native)
    jsi/       React Native JSI adapter (libgiovanni_jsi)
```

More context: [root README](https://github.com/acajoohq/giovanni/blob/master/README.md).

## Licensing

The package-authored TypeScript code is **Apache-2.0**. The bundled Ghostscript artifacts are **AGPL-3.0-or-later** (Artifex dual-license). The combined package metadata is therefore:

```
(Apache-2.0 AND AGPL-3.0-or-later)
```

The qpdf C++ library is separately licensed — see [`vendor/qpdf/LICENSE.txt`](../../vendor/qpdf/LICENSE.txt).
