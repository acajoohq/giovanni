# Ghostscript Native Build Room

This directory is reserved for Ghostscript-specific native build definitions that are not Docker recipes.

Current status:

- Docker recipe exists at `vendor-build/docker/ghostscript.Dockerfile`
- reserved Emscripten binding room exists at `vendor-build/ghostscript/bindings/emscripten/`
- no custom native Ghostscript wrapper exists yet
- current Ghostscript proof runs through CLI-style `callMain(...)` and MEMFS

When Ghostscript needs a custom native binding layer, put it here:

- `bindings/emscripten/`
  Emscripten-facing binding code, if we stop using the CLI-style module surface

- `toolchains/`
  Ghostscript-specific toolchain files, only if they diverge from the current Docker/configure path

- engine-specific helper sources
  Only if Ghostscript needs native adapter code beyond upstream sources
