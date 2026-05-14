# Ghostscript Emscripten Binding Contract

This directory is the reserved native boundary for Ghostscript-specific Emscripten code.

Current state:

- the Ghostscript WASM build uses upstream `gs.js` / `gs.wasm`
- the JS runtime drives it through `callMain(...)` and MEMFS
- there is no custom C/C++ binding layer yet

Why this directory exists now:

- to keep the engine layout parallel with `vendor-build/qpdf/bindings/emscripten/`
- to give Ghostscript a stable home if we replace the CLI-style surface with a narrower `gsapi_*` wrapper later

If we add a native adapter, it should live here and export a narrower runtime contract than raw `callMain(...)`.
