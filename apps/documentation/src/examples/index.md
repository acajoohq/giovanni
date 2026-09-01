# Examples

Runnable sample apps that exercise `@acajoo/giovanni-core` in a real browser environment, in [`examples/`](https://github.com/acajoohq/giovanni/tree/master/examples) at the repo root.

<div class="examples-table">

| Example           | Source                                                                                 | Description                                                                                                                                                                                                                                                                                                                |
| ----------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **web-simple**    | [View source](https://github.com/acajoohq/giovanni/tree/master/examples/web-simple)    | A minimal drag-and-drop compression demo: pick or drop a PDF, choose an engine (qpdf, Ghostscript, or combined) and preset, and download the compressed result with before/after size stats. Good starting point for wiring `compressPdf` into a UI.                                                                       |
| **wasm-standard** | [View source](https://github.com/acajoohq/giovanni/tree/master/examples/wasm-standard) | A smoke-test harness that runs almost every exported function — both compression engines, `QpdfDocument`, `splitPdf`, `mergePdfs`, `organizePdf`, `extractImages`, error classes, binding registries, and more — against a sample PDF and reports pass/fail for each step. Useful as a reference for the full API surface. |

</div>

## Running an example locally

```bash
pnpm install
pnpm -F @acajoo/giovanni-core build
pnpm --filter ./examples/web-simple dev      # or ./examples/wasm-standard
```

Each example is a standalone Vite app that depends on `@acajoo/giovanni-core` via the workspace, so the core package must be built first.
