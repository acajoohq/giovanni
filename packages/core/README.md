# @acajoo/giovanni-core

[qpdf](https://github.com/qpdf/qpdf) built for multiple runtimes compress, split, merge, extract images, inspect, and organize PDFs across WebAssembly (browser and Node.js), native C FFI, and React Native JSI targets. Experimental **Ghostscript** support adds lossy image recompression. The root package is task-oriented; engine-specific APIs live under `@acajoo/giovanni-core/qpdf` and `@acajoo/giovanni-core/ghostscript`.

**PDF.js rasterisation** (full page → JPEG) lives in the sibling package **`@acajoo/giovanni-pdf-render`**, not in this module.

Full public API documentation: [docs.giovanni.pizza](https://docs.giovanni.pizza).

## Install

```bash
pnpm add @acajoo/giovanni-core
# npm install @acajoo/giovanni-core
```

Needs **Node 24+** for local dev ([`engines`](package.json)). Docker is the build toolchain for the vendored WASM engines. On Windows, use Docker Desktop with Linux containers enabled.

## Usage

```ts
import { compressPdf, inspectPdf, splitPdf } from "@acajoo/giovanni-core";

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
import { compressPdf } from "@acajoo/giovanni-core";
import { optimizePdf, QpdfDocument } from "@acajoo/giovanni-core/qpdf";
import { compressPdfWithGhostscript } from "@acajoo/giovanni-core/ghostscript";

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
import { renderPdfPagesToJpg } from "@acajoo/giovanni-pdf-render";
```

### Ghostscript

Ghostscript is the lossy rewrite path. It re-encodes images and rewrites the entire PDF through the `pdfwrite` device, which can recover much more space than qpdf on scan-heavy documents.

> **Experimental.** Ghostscript is not yet considered stable in this package.

Observed behavior in this repo:

- `qpdf.wasm` ≈ 1 MB - fast, lossless structural rewrites
- `ghostscript.wasm` ≈ 17 MB - slower; can save significantly more on image-heavy PDFs
- Processing time for larger scanned PDFs can reach several seconds

**Licensing:** Ghostscript is dual-licensed under AGPLv3 or a commercial license by Artifex. This package's metadata reflects `(Apache-2.0 AND AGPL-3.0-or-later)`. SaaS and closed-source distribution likely require careful AGPL compliance review or a commercial license. Read the official pages before distributing a Ghostscript-enabled build:

- [Artifex licensing](https://artifex.com/licensing)
- [Ghostscript FAQ](https://ghostscript.com/faq/)

## Building

### WASM (web / Node.js)

Requires **Docker Desktop** (Linux containers). Pinned source archives are fetched inside the container - no manual vendor clone needed.

```bash
# Full build (WASM + bundle)
pnpm --filter @acajoo/giovanni-core build

# WASM engines only (parallel)
pnpm --filter @acajoo/giovanni-core build:wasm

# Individual engine builds
pnpm --filter @acajoo/giovanni-core build:qpdf:dev
pnpm --filter @acajoo/giovanni-core build:qpdf:prd
pnpm --filter @acajoo/giovanni-core build:ghostscript:dev
pnpm --filter @acajoo/giovanni-core build:ghostscript:prd
```

If your Docker buildx driver supports local cache export, the build reuses a per-engine cache directory. Override the cache location with:

```bash
GIOVANNI_DOCKER_CACHE_ROOT=.tmp/docker-buildx-cache pnpm --filter @acajoo/giovanni-core build:wasm
```

Vendor sync contract:

- Pinned source archives are declared in `tools/vendor/upstreams.ts`
- Docker fetches those archives during the build
- No manual host-side vendor cache is required

### C FFI (native)

Produces `libgiovanni_native` (static by default) and a C header `giovanni_c.h`. This build **optionally links Ghostscript in too**, in addition to qpdf.

#### Linux / macOS

Requires **Docker** (fetches qpdf and, optionally, GhostPDL source inside the container, same pipeline as WASM). GhostPDL's own `./configure && make libgs` produces a real static archive that gets linked into `libgiovanni_native.a` like any other static dependency.

```bash
pnpm --filter @acajoo/giovanni-core build:native
```

#### Windows

Requires **Git**, **MSVC** (Visual Studio 2022 with the C++ Desktop workload, including `nmake`), and **CMake** (bundled with VS). No manual dependency setup for qpdf on first run the script clones and bootstraps a project-local vcpkg under `.tmp/vcpkg` and uses it to fetch qpdf automatically. Ghostscript is different: GhostPDL's MSVC makefile has no static-lib target, only a DLL (`gsdll64.dll`) + its import lib (`gsdll64.lib`), so the script fetches GhostPDL source and builds that separately with `nmake`.

```powershell
pnpm --filter @acajoo/giovanni-core build:native:win
```

Subsequent runs skip the qpdf clone/bootstrap step and the GhostPDL source fetch; vcpkg caches installed packages, and GhostPDL only rebuilds objects nmake considers stale. Set `GIOVANNI_SKIP_GHOSTSCRIPT=1` to skip building Ghostscript entirely `GhostscriptEngine` then compiles as a stub that throws instead of failing the whole build.

**Because Ghostscript is a DLL on Windows (not a static lib), `gsdll64.dll` is a runtime dependency** of anything that links `giovanni_native.lib` - it must sit next to the final executable, not just be available at link time. The script copies it into `build/native/`; consumers need their own copy step for their own output directory (e.g. `apps/desktop/src-tauri/build.rs` copies it next to the compiled Tauri binary).

---

Output lands in `build/native/` for both platforms:

- Linux / macOS: `libgiovanni_native.a` + `giovanni_c.h` (+ `libgs.a` if Ghostscript was built)
- Windows: `giovanni_native.lib` + `giovanni_c.h` (+ `gsdll64.lib` and `gsdll64.dll` if Ghostscript was built)

```c
#include "giovanni_c.h"

GiovanniQpdfHandle h = giovanni_qpdf_create();
// ... giovanni_write_pdf, giovanni_split_pages, giovanni_merge_pdfs ...
giovanni_qpdf_destroy(h);
```

If the build linked Ghostscript in, `giovanni_rewrite_pdf` runs a `pdfwrite` pass through the real `gsapi_*` embedding API, same lossy rewrite path as the WASM Ghostscript engine, just with plain `gs` command-line args instead of the TypeScript option objects:

```c
GiovanniGhostscriptHandle gs = giovanni_ghostscript_create();

const char* args[] = {
    "-sDEVICE=pdfwrite", "-dBATCH", "-dNOPAUSE", "-dSAFER", "-dQUIET",
    "-dPDFSETTINGS=/screen",
};
uint8_t* out_data;
size_t out_size;
giovanni_rewrite_pdf(gs, input, input_size, args, 6, &out_data, &out_size);
// ... use out_data / out_size, then giovanni_buffer_free(out_data) ...

giovanni_ghostscript_destroy(gs);
```

If Ghostscript wasn't linked in (`GIOVANNI_SKIP_GHOSTSCRIPT` on Windows, or no GhostPDL source available on Linux), `giovanni_ghostscript_create` still succeeds but `giovanni_rewrite_pdf`/`giovanni_get_ghostscript_version` return an error, check `giovanni_last_error()`.

Usable from Python, Rust, Go, Swift, or any language with a C FFI. Build as a shared library instead of static:

```bash
GIOVANNI_NATIVE_SHARED=1 pnpm --filter @acajoo/giovanni-core build:native
```

### React Native (JSI)

Produces `libgiovanni_jsi` (shared library) that registers a synchronous `giovanni` object on the JSI runtime, exposing `getVersion`, `writePdf`, `splitPages`, `mergePdfs`, and `getDocumentInfo`.

```bash
# Point to your ReactCommon directory (contains jsi/jsi.h)
GIOVANNI_JSI_INCLUDE_DIR=/path/to/node_modules/react-native/ReactCommon \
  pnpm --filter @acajoo/giovanni-core build:jsi
```

Output lands in `build/jsi/`. If `GIOVANNI_JSI_INCLUDE_DIR` is not set, the build compiles a stub-only fallback without the JSI runtime dependency.

### Build all native targets

```bash
pnpm --filter @acajoo/giovanni-core build:native:all
```

### Build environment variables

| Variable                     | Applies to         | Description                                                       |
| ---------------------------- | ------------------ | ----------------------------------------------------------------- |
| `GIOVANNI_DOCKER_CACHE_ROOT` | WASM builds        | Override Docker buildx cache directory                            |
| `GIOVANNI_NATIVE_SHARED=1`   | `build:native`     | Build shared library instead of static                            |
| `GIOVANNI_JSI_INCLUDE_DIR`   | `build:jsi`        | Path to `ReactCommon/` (JSI headers)                              |
| `GIOVANNI_NATIVE_JOBS`       | native / JSI       | Parallel CMake build jobs                                         |
| `VCPKG_ROOT`                 | `build:native:win` | Use an existing standalone vcpkg instead of the auto-bootstrap    |
| `GIOVANNI_VCPKG_TRIPLET`     | `build:native:win` | Override vcpkg triplet (default: `x64-windows-static`)            |
| `GIOVANNI_CMAKE_GENERATOR`   | `build:native:win` | Override CMake generator (default: auto-detected by VS install)   |
| `GIOVANNI_SKIP_GHOSTSCRIPT`  | `build:native:win` | Skip building Ghostscript; `GhostscriptEngine` compiles as a stub |

## Development

```bash
pnpm --filter @acajoo/giovanni-core test
pnpm --filter @acajoo/giovanni-core validate
pnpm --filter @acajoo/giovanni-core package:check
```

Smoke test the Ghostscript WASM artifact end to end:

```bash
pnpm --filter @acajoo/giovanni-core smoke:ghostscript \
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

- [`native/README.md`](./native/README.md) C++ native layer (interface → impl → targets)

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

The qpdf C++ library is separately licensed, see [`vendor/qpdf/LICENSE.txt`](../../vendor/qpdf/LICENSE.txt).
