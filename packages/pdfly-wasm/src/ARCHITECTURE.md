# Source layout

This package is split by responsibility.

- `src/index.ts`, `src/qpdf.ts`, `src/ghostscript.ts`

    Public package entrypoints: task-level root API plus engine-specific subpaths.

- `src/operations/*.ts`

    Public PDF operations (compress, split, merge, inspect, organize, extract images).

- `src/engines/qpdf/*`

    qpdf WASM module loading, compression engine implementation, and `QpdfDocument` advanced API.

- `src/engines/ghostscript/*`

    Ghostscript WASM module loading, execution queue, option mapping, rewrite path, and compression engine implementation.

- `src/compression/*`

    Engine-neutral compression engine interface and registry.

- `src/runtime/*`

    Shared Emscripten module loading helpers used by all engines.

- `src/errors/*`

    Typed errors by engine (`qpdf.error.ts`, `ghostscript.error.ts`), re-exported from `index.ts`.

- `src/types/*`

    Public and internal TypeScript declarations grouped by domain stem (`pdf.types.ts`, `qpdf.types.ts`, `ghostscript.types.ts`, `compression.types.ts`, `wasm.types.ts`), re-exported from `index.ts`.

- `src/utils/*`

    Shared byte helpers and formatting helpers.

Rule of thumb:

- qpdf-only code lives in `engines/qpdf/`
- Ghostscript-only code lives in `engines/ghostscript/`
- cross-engine dispatch lives in `compression/`
- user-facing operations live in `operations/`
- shared WASM bootstrap lives in `runtime/`
