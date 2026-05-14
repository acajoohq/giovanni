# Native build contract

This directory contains native (CMake / Emscripten) and container build definitions for upstream engines used by `@pdfly/wasm`.

## Separation of concerns

- `tools/vendor/*`
  Orchestration only: pinned source definitions, target selection, Docker invocation

- `native/docker/*`
  Container recipes only: isolated build environments for each upstream engine

- `native/qpdf/*`
  qpdf-specific native build definition only: CMake, toolchains, Emscripten bindings

- `native/ghostscript/*`
  Ghostscript-specific native build definition only: Docker-driven upstream build plus the narrow `gsapi_*` Emscripten wrapper

- `build/qpdf` and `build/ghostscript`
  Generated artifacts only: build outputs consumed by packaging or smoke scripts

- `src/*`
  Runtime/library API only: package code that ships to consumers

## Output contract

Each engine writes to its own output directory:

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
  Ghostscript module loading, runtime execution, option normalization, and engine adapter

- `src/compression/*`
  shared engine adapter contract and engine registry

- `src/runtime/wasmModule.loader.ts`
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
- Ghostscript parallelism:
    - `PDFLY_GHOSTSCRIPT_JOBS=<n>`
- Docker BuildKit cache root:
    - `PDFLY_DOCKER_CACHE_ROOT=<path>`

Example:

```bash
PDFLY_GHOSTSCRIPT_JOBS=4 pnpm --filter @pdfly/wasm build:ghostscript:prd
PDFLY_DOCKER_CACHE_ROOT=.tmp/docker-buildx-cache pnpm --filter @pdfly/wasm build:wasm
```

## Build behavior

- `build:wasm` invokes qpdf and Ghostscript in parallel
- local cache export is used only when the active `docker buildx` driver supports it
- plain `docker` drivers still work; they just skip cache export/import and rely on the driver's own layer cache
