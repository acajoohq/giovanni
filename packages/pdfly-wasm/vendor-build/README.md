# Vendor Build Contract

This directory contains the build definitions for vendored upstream engines used by `@pdfly/wasm`.

## Separation of concerns

- `tools/vendor/*`
  Orchestration only: pinned source definitions, target selection, Docker invocation

- `vendor-build/docker/*`
  Container recipes only: isolated build environments for each upstream engine

- `vendor-build/qpdf/*`
  qpdf-specific native build definition only: CMake, toolchains, Emscripten bindings

- `vendor-build/ghostscript/*`
  Ghostscript-specific native build definition only: Docker-driven upstream build today, reserved `bindings/emscripten` room for a future `gsapi_*` wrapper

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

- `src/core/qpdf/*`
  qpdf module loading and engine adapter

- `src/core/ghostscript/*`
  Ghostscript module loading, runtime execution, option normalization, and engine adapter

- `src/core/compression/*`
  shared engine adapter contract and engine registry

- `src/core/shared/wasm-loader.ts`
  shared Emscripten module-loader helpers used by both engines

- `src/core/README.md`
  short filesystem contract for contributors working in the runtime layer

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

Example:

```bash
PDFLY_GHOSTSCRIPT_JOBS=4 pnpm --filter @pdfly/wasm build:ghostscript:prd
```
