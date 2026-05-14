# Ghostscript Emscripten Binding Contract

This directory is the reserved native boundary for Ghostscript-specific Emscripten code.

Current state:

- the Ghostscript WASM build still produces `ghostscript.js` / `ghostscript.wasm`
- this directory owns the custom C++ wrapper over `gsapi_*`
- the exported JS surface is intentionally narrow:
  - `rewritePdf(data, args)`
  - `getGhostscriptVersion()`

Why this directory exists:

- to keep the engine layout parallel with `vendor-build/qpdf/bindings/emscripten/`
- to keep Ghostscript lifecycle, stdio capture, temp file handling, and `gsapi_*` calls out of TypeScript

Design rule:

- keep the native surface small and operation-oriented
- do not mirror the entire Ghostscript embedding API into JS unless the product actually needs it
