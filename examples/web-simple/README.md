# web-simple

A minimal drag-and-drop PDF compression demo built on [`@acajoo/giovanni-core`](https://github.com/acajoohq/giovanni/tree/master/packages/core).

Drop or pick a PDF, choose a compression engine (`qpdf`, `ghostscript`, or `combined`) and preset, then download the compressed result with before/after size stats.

## Running

From the repo root:

```bash
pnpm install
pnpm -F @acajoo/giovanni-core build
pnpm --filter ./examples/web-simple dev
```

## Scripts

- `pnpm dev` — start the Vite dev server
- `pnpm build` — type-check and build for production
- `pnpm preview` — preview the production build

## Source

[`src/main.ts`](src/main.ts) wires up the dropzone, engine/preset selects, and the `compressPdf` call.
