# @pdfly/pdf-render

Render PDF pages to JPEG using [PDF.js](https://github.com/mozilla/pdf.js). Browser-first; optional Node [`canvas`](https://www.npmjs.com/package/canvas) for server-side rasterisation.

This package is separate from [`@pdfly/wasm`](../pdfly-wasm/) (qpdf + Ghostscript WASM).

## Install

```bash
pnpm add @pdfly/pdf-render pdfjs-dist
```

## Usage

```ts
import { renderPdfPagesToJpg } from "@pdfly/pdf-render";

const input = await fetch("document.pdf").then((r) => r.arrayBuffer());
const { pages, convertedPageCount } = await renderPdfPagesToJpg(input, { quality: 0.92, scale: 2 });
```
