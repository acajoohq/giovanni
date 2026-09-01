# wasm-standard

A smoke-test harness for [`@acajoo/giovanni-core`](https://github.com/acajoohq/giovanni/tree/master/packages/core) that exercises almost every exported function against a sample PDF — both compression engines, `QpdfDocument`, `splitPdf`, `mergePdfs`, `organizePdf`, `extractImages`, error classes, and binding registries — reporting pass/fail for each step in the browser.

Useful as a reference for the full API surface, or as a quick sanity check after changing the core package.

## Running

From the repo root:

```bash
pnpm install
pnpm -F @acajoo/giovanni-core build
pnpm --filter ./examples/wasm-standard dev
```

## Scripts

- `pnpm dev` — start the Vite dev server
- `pnpm build` — type-check and build for production
- `pnpm preview` — preview the production build

## Source

[`src/main.ts`](src/main.ts) defines the list of steps run against `public/sample.pdf` and renders the pass/fail results.
