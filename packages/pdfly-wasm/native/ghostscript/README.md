# Ghostscript Native Build Room

This directory is reserved for Ghostscript-specific native build definitions that are not Docker recipes.

Current status:

- Docker recipe exists at `native/ghostscript/docker.Dockerfile`
- Ghostscript-specific Emscripten bindings live at `native/ghostscript/bindings/emscripten/`
- the current wrapper is a narrow `gsapi_*` adapter for rewrite/version operations
- the TypeScript runtime no longer drives Ghostscript through `callMain(...)`

Current native responsibility split:

- `bindings/emscripten/`
  Emscripten-facing Ghostscript wrapper code

- `toolchains/`
  Ghostscript-specific toolchain files, only if they diverge from the current Docker/configure path

- engine-specific helper sources
  Only if Ghostscript needs native adapter code beyond upstream sources
