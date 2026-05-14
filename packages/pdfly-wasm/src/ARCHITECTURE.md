# Source layout

This package is split by responsibility.

- `src/operations/*.ts`

  Public PDF operations (compress, split, merge, inspect, organize, extract images).

- `src/engines/qpdf/*`

  qpdf WASM module loading, compression adapter, and `QpdfDocument` advanced API.

- `src/engines/ghostscript/*`

  Ghostscript WASM module loading, runtime, option mapping, rewrite path, and compression adapter.

- `src/compression/*`

  Engine-neutral compression adapter contract and registry.

- `src/runtime/*`

  Shared Emscripten module loading helpers used by all engines.

- `src/errors/*`

  Typed errors by engine (`qpdf.ts`, `ghostscript.ts`), re-exported from `index.ts`.

- `src/types/*`

  Public and internal TypeScript declarations grouped by domain (`common`, `qpdf-options`, `ghostscript-options`, results).

- `src/utils/*`

  Shared validation and formatting helpers.

Rule of thumb:

- qpdf-only code lives in `engines/qpdf/`
- Ghostscript-only code lives in `engines/ghostscript/`
- cross-engine dispatch lives in `compression/`
- user-facing operations live in `operations/`
- shared WASM bootstrap lives in `runtime/`
