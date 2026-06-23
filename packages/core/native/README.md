# Native build contract

This directory contains the C++ interface, platform-agnostic implementation,
and platform-specific build targets for the giovanni engines.

## Architecture

```
native/
  interface/           <- Canonical C++ types + abstract interface (source of truth)
  impl/                <- Platform-agnostic C++ implementations
  targets/             <- Platform-specific adapters
    jsi/               <- React Native JSI -> native module
    native/            <- Standalone C library for FFI (Python, Rust, Go, etc.)
  qpdf/                <- Emscripten build definition for the qpdf WASM target
  ghostscript/         <- Emscripten build definition for the Ghostscript WASM target
```

### Layer 1 — `interface/`

Contains the **single source of truth** for all data types and abstract
interfaces used across every build target. No platform or runtime headers
are included here.

| File                                 | Purpose                                            |
| ------------------------------------ | -------------------------------------------------- |
| `interface/include/giovanni/types.h` | `WriteOptions`, `DocumentInfo`, `ExtractedImage`   |
| `interface/include/giovanni/api.h`   | `IQpdfEngine`, `IGhostscriptEngine` (pure virtual) |

These types mirror the TypeScript `NativeWriteOptions` / `NativeDocumentInfo` /
`NativeExtractedImage` interfaces in `src/bindings/`.

### Layer 2 — `impl/`

Platform-agnostic **concrete implementations** of the abstract interfaces.
No Emscripten, no JSI, no browser APIs.

| Directory           | Class               | Implements                            |
| ------------------- | ------------------- | ------------------------------------- |
| `impl/qpdf/`        | `QpdfEngine`        | `IQpdfEngine` via libqpdf             |
| `impl/ghostscript/` | `GhostscriptEngine` | `IGhostscriptEngine` via gsapi (TODO) |

### Layer 3 — `targets/`

Platform adapters. Each target takes `IQpdfEngine` / `IGhostscriptEngine`
as a dependency and adapts the input/output types for its runtime.

| Target            | Output                                      | Use case                               |
| ----------------- | ------------------------------------------- | -------------------------------------- |
| `targets/jsi/`    | `.so` / `.dylib`                            | React Native (Hermes JSI)              |
| `targets/native/` | `libgiovanni_native.a/.so` + `giovanni_c.h` | FFI from Python, Rust, Go, Swift, etc. |

---

## Separation of concerns

- **`tools/vendor/*`**
  Orchestration only: pinned source definitions, target selection, Docker invocation

- **`qpdf/`** (Emscripten target — WASM output)
  qpdf-specific Emscripten build: Docker recipe, CMake, toolchains, Emscripten bindings

- **`ghostscript/`** (Emscripten target — WASM output)
  Ghostscript-specific Docker-driven build + narrow `gsapi_*` Emscripten wrapper

- **`build/qpdf`** and **`build/ghostscript`**
  Generated artifacts consumed by the TypeScript package

- **`src/*`**
  Runtime/library API: TypeScript package code that ships to consumers

## Ghostscript Emscripten binding

`native/ghostscript/bindings/emscripten/` owns the custom C++ wrapper over `gsapi_*`. The exported JS surface is intentionally narrow:

- `rewritePdf(data, args)`
- `getGhostscriptVersion()`

It exists to keep Ghostscript lifecycle, stdio capture, temp file handling, and `gsapi_*` calls out of TypeScript, and to keep the engine layout parallel with `native/qpdf/bindings/emscripten/`.

Design rule: keep the native surface small and operation-oriented — do not mirror the full Ghostscript embedding API into JS unless the product actually needs it.

**TODO:** Add `bindings/cpp/` to support native build targets (desktop, React Native, server), mirroring the QPDF two-layer structure.

## Build targets

### WASM (web)

```bash
# Uses the existing qpdf/ Emscripten build
cd qpdf
emcmake cmake -B build -DQPDF_SOURCE_DIR=../../../../vendor/qpdf
cmake --build build
```

### Standalone C library (FFI)

```bash
cd targets/native
cmake -B build -DQPDF_SOURCE_DIR=../../../../../vendor/qpdf
cmake --build build
# produces: build/libgiovanni_native.a + giovanni_c.h
```

Python FFI example:

```python
import ctypes, pathlib

lib = ctypes.CDLL(str(pathlib.Path("build/libgiovanni_native.so")))
lib.giovanni_qpdf_create.restype = ctypes.c_void_p

handle = lib.giovanni_qpdf_create()
buf = ctypes.create_string_buffer(64)
lib.giovanni_get_version(handle, buf, 64)
print(buf.value.decode())  # e.g. "2.5.0"
lib.giovanni_qpdf_destroy(handle)
```

### C++ library (direct C++ use)

```bash
cd qpdf/bindings/cpp
cmake -B build -DQPDF_SOURCE_DIR=../../../../../../vendor/qpdf
cmake --build build
# produces: build/libgiovanni_qpdf.a
```

### JSI (React Native)

```bash
cd targets/jsi/qpdf
cmake -B build \
  -DQPDF_SOURCE_DIR=../../../../../../vendor/qpdf \
  -DJSI_INCLUDE_DIR=/path/to/react-native/ReactCommon
cmake --build build
```

## Output contract

Each WASM engine writes to its own output directory:

- `build/qpdf`
    - `qpdf.js`
    - `qpdf.wasm`
    - `manifest.json`

- `build/ghostscript`
    - `ghostscript.js`
    - `ghostscript.wasm`
    - `manifest.json`

That engine-named output is the stable contract for tooling, tests, and packaging.

## Runtime structure

The TypeScript runtime mirrors the engine split:

- `src/engines/qpdf/*`
  qpdf module loading, document API, and engine adapter

- `src/engines/ghostscript/*`
  Ghostscript module loading, execution queue, option normalization, and engine adapter

- `src/compression/*`
  shared engine adapter contract and engine registry

- `src/runtime/wasm-module.loader.ts`
  shared Emscripten module-loader helpers used by both engines

- `src/ARCHITECTURE.md`
  filesystem contract for contributors working in the runtime layer

## Vendor source contract

Pinned upstream sources are defined in:

- `tools/vendor/upstreams.ts`

Docker fetches those archives during the build. There is no host-side vendor sync step anymore.

## Supported tweaks

Keep tweaks explicit and narrow.

- build mode:
    - `qpdf`: `dev | prd`
    - `ghostscript`: `dev | prd`
- qpdf parallelism:
    - `GIOVANNI_QPDF_JOBS=<n>`
- Ghostscript parallelism:
    - `GIOVANNI_GHOSTSCRIPT_JOBS=<n>`
- Docker BuildKit cache root:
    - `GIOVANNI_DOCKER_CACHE_ROOT=<path>`

Example:

```bash
GIOVANNI_QPDF_JOBS=2 pnpm --filter @giovanni/core build:qpdf:prd
GIOVANNI_GHOSTSCRIPT_JOBS=4 pnpm --filter @giovanni/core build:ghostscript:prd
GIOVANNI_DOCKER_CACHE_ROOT=.tmp/docker-buildx-cache pnpm --filter @giovanni/core build:wasm
```

## Build behavior

- `build:wasm` invokes qpdf and Ghostscript in parallel
- local cache export is used only when the active `docker buildx` driver supports it
- plain `docker` drivers still work; they just skip cache export/import and rely on the driver's own layer cache
