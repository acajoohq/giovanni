# Ghostscript WASM Plan

This file is the working plan and progress ledger for the Ghostscript integration in `@pdfly/wasm`.

## Current Status

Completed:

- [x] Pinned upstream definition for `qpdf` and `ghostscript`
- [x] Removed host-side vendor sync; Docker now fetches pinned source archives directly
- [x] Unified Docker-first build entrypoint for both upstream engines
- [x] Verified qpdf and Ghostscript builds with Docker-owned source fetching
- [x] Separated orchestration (`tools/`) from native build definitions (`native/`)
- [x] Docker-first Ghostscript WASM build
- [x] PDF-focused build surface (`--without-pcl`, `--without-xps`)
- [x] `ghostscript.js` + `ghostscript.wasm` artifact export
- [x] Node smoke test for the Ghostscript rewrite path
- [x] Real-file viability check on a large image-heavy PDF
- [x] Internal Ghostscript runtime, rewrite path, typed options, and public compression facade
- [x] Shared Emscripten module-loader contract for qpdf and Ghostscript
- [x] Native Ghostscript `gsapi_*` wrapper under `native/ghostscript/bindings/emscripten/`
- [x] Default package build now produces both qpdf and Ghostscript WASM artifacts
- [x] Ghostscript module surface normalized to the same loader/version contract as qpdf
- [x] Web compression UI can now switch between qpdf and Ghostscript with engine-specific controls
- [x] qpdf + Ghostscript vendor builds now run in parallel from one entrypoint
- [x] Docker-native GitHub Actions flow updated to the same pinned-archive build contract
- [x] package-level release verification checks built artifacts and exercises both engines from `dist/`
- [x] licensing and runtime caveats are now documented in the package README

Current proof point:

- input PDF bytes -> Ghostscript WASM -> `pdfwrite` -> output PDF bytes
- input/output rewrite now flows through a narrow native `rewritePdf(...)` binding instead of JS-side `callMain(...)`

Scope note:

- the source of truth is now `tools/vendor/upstreams.ts`
- Docker fetches pinned archives directly during the build
- there is no host-side vendor cache contract anymore
- local rebuild speed currently depends on the Docker builder cache; explicit shared cache config is still optional follow-up
- local cache export/import is now explicit when the active `docker buildx` driver supports it; plain `docker` drivers fall back cleanly without that cache path

## Main Goal

Add Ghostscript as a second compression engine in `@pdfly/wasm`, with:

- a clean internal runtime
- typed compression options
- tree-shaking-safe loading boundaries
- a neutral compression facade above `qpdf` and `ghostscript`

## Phases

### Phase 1: Internal Ghostscript Runtime

Goal:

- move the smoke-test logic into `src/engines/ghostscript/*`
- keep it internal until the runtime is stable

Todos:

- [x] add `src/engines/ghostscript/module-loader.ts`
- [x] add Ghostscript runtime types
- [x] lazy-load `ghostscript.js`
- [x] resolve `ghostscript.wasm` through `locateFile(...)`
- [x] normalize Node/browser loading behavior
- [x] normalize the Ghostscript module surface to `getVersion()` + `rewritePdf(...)`
- [x] add package build copy/export path for Ghostscript runtime artifacts

Checkpoint:

- runtime can load from package code, not only from `tools/dev/ghostscript-smoke.ts`

### Phase 2: Internal Rewrite Operation

Goal:

- expose one narrow internal operation that rewrites a PDF with Ghostscript

Todos:

- [x] add `rewritePdfWithGhostscript(input, options): Promise<Uint8Array>`
- [x] move input/output path management into the native wrapper
- [x] support `preset` / `PDFSETTINGS`
- [x] capture stderr/stdout through `gsapi_set_stdio_with_handle(...)`
- [x] convert runtime failures into typed Ghostscript errors
- [x] ensure repeated calls do not leak files or stale state

Checkpoint:

- internal code can rewrite a PDF without using the smoke script

### Phase 3: Typed Options and Validation

Goal:

- replace raw CLI-ish assumptions with package-level typed options

Todos:

- [x] define Ghostscript option types
- [x] add preset support: `screen | ebook | printer | prepress | default`
- [x] add downsampling toggles
- [x] add DPI controls
- [x] add JPEG quality controls where they map cleanly
- [x] validate unsupported or conflicting options early

Checkpoint:

- Ghostscript operation takes typed options only

### Phase 4: Public Compression Engine Abstraction

Goal:

- introduce the engine-neutral compression layer without breaking qpdf users

Todos:

- [x] add `CompressionEngine = "qpdf" | "ghostscript"`
- [x] add `compressPdf(input, options)`
- [x] add `getAvailableCompressionEngines()`
- [x] add `initCompressionEngine(engine)`
- [x] keep `optimizePdf(...)` as qpdf-compatible wrapper
- [x] normalize result shape across engines

Checkpoint:

- one public facade can dispatch to qpdf or Ghostscript

### Phase 5: Tree-Shaking and Packaging

Goal:

- keep Ghostscript isolated so qpdf-only consumers do not pay for it

Todos:

- [x] keep Ghostscript behind a lazy boundary
- [x] avoid top-level Ghostscript imports from shared entrypoints
- [x] keep package exports unchanged; no Ghostscript subpath is needed yet
- [x] ensure `ghostscript.js` / `ghostscript.wasm` are copied separately
- [x] verify package metadata remains side-effect-safe

Checkpoint:

- qpdf-only import paths do not load Ghostscript runtime

### Phase 6: UI and Product Integration

Goal:

- expose Ghostscript in the web compression flow with clear engine-specific controls

Todos:

- [x] add engine selector to the web compression UI
- [x] keep qpdf as the default path initially
- [x] show Ghostscript presets cleanly
- [x] add advanced controls only where they are stable enough
- [x] explain that Ghostscript is lossy/rewrite-oriented

Checkpoint:

- web UI can run both engines intentionally

### Phase 7: Verification and Release Hardening

Goal:

- make the integration testable and releasable

Todos:

- [x] add unit tests for loader and option validation
- [x] add integration tests for Ghostscript rewrite path
- [x] add package-level artifact checks
- [x] compare representative qpdf vs Ghostscript outputs
- [x] document AGPL/licensing implications clearly
- [x] document known performance expectations and caveats
- [x] github actions

Checkpoint:

- Ghostscript path is documented, tested, and releasable as experimental

## Progress Update Checkpoints

Update this file after each of these milestones:

1. Docker build changes
2. vendor sync/build contract simplification
3. internal runtime loader works
4. internal rewrite function works
5. typed options land
6. public compression facade lands
7. tree-shaking/package export verification is done
8. web UI integration lands
9. test/release hardening lands

For each update:

- move completed items from `[ ]` to `[x]`
- add one short note under `Current Status`
- record any blocker or scope change

## Known Risks

- Ghostscript output quality/size tradeoffs are content-dependent
- browser runtime behavior may differ from Node for large files
- artifact naming and `locateFile(...)` behavior must stay stable
- Docker cache behavior is currently implicit in the local builder state
- package distribution must not accidentally force Ghostscript into qpdf-only bundles
- licensing needs explicit handling before wider release
- Ghostscript still has a smaller native surface than qpdf; deeper bindings should be added only if a real product workflow needs them

## Done Criteria

This work is done when:

- Ghostscript is available as a real engine in `@pdfly/wasm`
- qpdf remains backward-compatible
- runtime loading is lazy and tree-shaking-safe
- the web app can intentionally choose Ghostscript
- the experimental status and licensing constraints are documented
