# Ghostscript WASM Plan

This file is the working plan and progress ledger for the Ghostscript integration in `@pdfly/wasm`.

## Current Status

Completed:

- [x] Pinned vendor bootstrap for `qpdf` and `ghostpdl`
- [x] Unified Docker-first build entrypoint for both upstream engines
- [x] Separated orchestration (`tools/`) from native build definitions (`vendor-build/`)
- [x] Docker-first Ghostscript WASM build
- [x] PDF-focused build surface (`--without-pcl`, `--without-xps`)
- [x] `ghostscript.js` + `ghostscript.wasm` artifact export
- [x] Node smoke test through MEMFS and `pdfwrite`
- [x] Real-file viability check on a large image-heavy PDF

Current proof point:

- input PDF bytes -> Ghostscript WASM -> `pdfwrite` -> output PDF bytes

## Main Goal

Add Ghostscript as a second compression engine in `@pdfly/wasm`, with:

- a clean internal runtime
- typed compression options
- tree-shaking-safe loading boundaries
- a neutral compression facade above `qpdf` and `ghostscript`

## Phases

### Phase 1: Internal Ghostscript Runtime

Goal:

- move the smoke-test logic into `src/core/ghostscript/*`
- keep it internal until the runtime is stable

Todos:

- [ ] add `src/core/ghostscript/module-loader.ts`
- [ ] add Ghostscript runtime types
- [ ] lazy-load `ghostscript.js`
- [ ] resolve `ghostscript.wasm` through `locateFile(...)`
- [ ] normalize Node/browser loading behavior
- [ ] add package build copy/export path for Ghostscript runtime artifacts

Checkpoint:

- runtime can load from package code, not only from `tools/dev/ghostscript-smoke.ts`

### Phase 2: Internal Rewrite Operation

Goal:

- expose one narrow internal operation that rewrites a PDF with Ghostscript

Todos:

- [ ] add `rewritePdfWithGhostscript(input, options): Promise<Uint8Array>`
- [ ] map input/output through MEMFS
- [ ] support `preset` / `PDFSETTINGS`
- [ ] capture stderr/stdout for better debugging
- [ ] convert runtime failures into typed Ghostscript errors
- [ ] ensure repeated calls do not leak files or stale state

Checkpoint:

- internal code can rewrite a PDF without using the smoke script

### Phase 3: Typed Options and Validation

Goal:

- replace raw CLI-ish assumptions with package-level typed options

Todos:

- [ ] define Ghostscript option types
- [ ] add preset support: `screen | ebook | printer | prepress | default`
- [ ] add downsampling toggles
- [ ] add DPI controls
- [ ] add JPEG quality controls where they map cleanly
- [ ] validate unsupported or conflicting options early

Checkpoint:

- Ghostscript operation takes typed options only

### Phase 4: Public Compression Engine Abstraction

Goal:

- introduce the engine-neutral compression layer without breaking qpdf users

Todos:

- [ ] add `CompressionEngine = "qpdf" | "ghostscript"`
- [ ] add `compressPdf(input, options)`
- [ ] add `getAvailableCompressionEngines()`
- [ ] add `initCompressionEngine(engine)`
- [ ] keep `optimizePdf(...)` as qpdf-compatible wrapper
- [ ] normalize result shape across engines

Checkpoint:

- one public facade can dispatch to qpdf or Ghostscript

### Phase 5: Tree-Shaking and Packaging

Goal:

- keep Ghostscript isolated so qpdf-only consumers do not pay for it

Todos:

- [ ] keep Ghostscript behind a lazy boundary
- [ ] avoid top-level Ghostscript imports from shared entrypoints
- [ ] add package exports if subpaths are needed
- [ ] ensure `ghostscript.js` / `ghostscript.wasm` are copied separately
- [ ] verify package metadata remains side-effect-safe

Checkpoint:

- qpdf-only import paths do not load Ghostscript runtime

### Phase 6: UI and Product Integration

Goal:

- expose Ghostscript in the web compression flow with clear engine-specific controls

Todos:

- [ ] add engine selector to the web compression UI
- [ ] keep qpdf as the default path initially
- [ ] show Ghostscript presets cleanly
- [ ] add advanced controls only where they are stable enough
- [ ] explain that Ghostscript is lossy/rewrite-oriented

Checkpoint:

- web UI can run both engines intentionally

### Phase 7: Verification and Release Hardening

Goal:

- make the integration testable and releasable

Todos:

- [ ] add unit tests for loader and option validation
- [ ] add integration tests for Ghostscript rewrite path
- [ ] add package-level artifact checks
- [ ] compare representative qpdf vs Ghostscript outputs
- [ ] document AGPL/licensing implications clearly
- [ ] document known performance expectations and caveats

Checkpoint:

- Ghostscript path is documented, tested, and releasable as experimental

## Progress Update Checkpoints

Update this file after each of these milestones:

1. Docker build changes
2. internal runtime loader works
3. internal rewrite function works
4. typed options land
5. public compression facade lands
6. tree-shaking/package export verification is done
7. web UI integration lands
8. test/release hardening lands

For each update:

- move completed items from `[ ]` to `[x]`
- add one short note under `Current Status`
- record any blocker or scope change

## Known Risks

- Ghostscript output quality/size tradeoffs are content-dependent
- browser runtime behavior may differ from Node for large files
- artifact naming and `locateFile(...)` behavior must stay stable
- package distribution must not accidentally force Ghostscript into qpdf-only bundles
- licensing needs explicit handling before wider release

## Done Criteria

This work is done when:

- Ghostscript is available as a real engine in `@pdfly/wasm`
- qpdf remains backward-compatible
- runtime loading is lazy and tree-shaking-safe
- the web app can intentionally choose Ghostscript
- the experimental status and licensing constraints are documented
