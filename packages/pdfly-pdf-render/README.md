# @pdfly/pdf-render

Render PDF pages to JPEG using [PDF.js](https://github.com/mozilla/pdf.js). Browser-first; optional Node [`canvas`](https://www.npmjs.com/package/canvas) for server-side rasterisation.

This package is separate from [`@pdfly/wasm`](../pdfly-wasm/) (qpdf + Ghostscript WASM).

## pdf.js build selection

pdf.js ships two builds from the same `pdfjs-dist` version:

- **Standard** (`pdfjs-dist/build/*`) for Chromium, Firefox, Node.js, WebView2, and other runtimes with modern JavaScript APIs.
- **Polyfill** (`pdfjs-dist/legacy/build/*`, historically called “legacy”) for Safari, WKWebView, WebKitGTK, and other runtimes missing APIs such as `Map.prototype.getOrInsertComputed`.

`renderPdfPagesToJpg` and `@pdfly/pdf-render/pdfjs/browser` pick the build at runtime via `needsPolyfillBuild()`. Force the polyfill build with `@pdfly/pdf-render/pdfjs-legacy/browser` when needed.

Always keep each main module and worker on the **same** `pdfjs-dist` version.

- [pdf.js browser support FAQ](https://github.com/mozilla/pdf.js/wiki/Frequently-Asked-Questions#which-browsersenvironments-are-supported)
- [Tauri WebView versions](https://v2.tauri.app/reference/webview-versions/)

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
import { getDocument } from "@pdfly/pdf-render/pdfjs/browser";

const pdf = await getDocument({ data: bytes }).promise;
```
