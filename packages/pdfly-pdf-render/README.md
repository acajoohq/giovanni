# @pdfly/pdf-render

Render PDF pages to JPEG using [PDF.js](https://github.com/mozilla/pdf.js). Browser-first; optional Node [`canvas`](https://www.npmjs.com/package/canvas) for server-side rasterisation.

This package is separate from [`@pdfly/wasm`](../pdfly-wasm/) (qpdf + Ghostscript WASM).

## pdf.js legacy build

Giovanni uses Mozilla's **legacy** pdf.js bundle (`pdfjs-dist/legacy/build/*`), not the modern build. The legacy bundle ships the polyfills pdf.js maintains for Safari, older Chromium, and **Tauri WKWebView** (WebKit), which may lack APIs such as `Map.prototype.getOrInsertComputed`.

Always keep the legacy main module and worker on the **same** `pdfjs-dist` version.

- [pdf.js browser support FAQ](https://github.com/mozilla/pdf.js/wiki/Frequently-Asked-Questions#which-browsersenvironments-are-supported)
- [Tauri WebView versions](https://v2.tauri.app/reference/webview-versions/)

Browser / Vite apps import `@pdfly/pdf-render/pdfjs-legacy/browser` so the worker URL is bundled correctly.

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

Browser preview (Vite / Tauri):

```ts
import { getDocument } from "@pdfly/pdf-render/pdfjs-legacy/browser";

const pdf = await getDocument({ data: bytes }).promise;
```
