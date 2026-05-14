# Pdfly

Local-first PDF tools on [qpdf](https://github.com/qpdf/qpdf) + WebAssembly. PDF bytes stay on the device.

**Layout:** [`apps/web`](apps/web) (main UI), [`apps/pdfly-desktop`](apps/pdfly-desktop) (Tauri), [`packages/pdfly-wasm`](packages/pdfly-wasm) (`@pdfly/wasm`), [`packages/pdfly-ui`](packages/pdfly-ui). Upstream PDF engines are pinned and fetched automatically into `vendor/` when needed.

## Requirements

- Node.js 24+
- pnpm 10.33+
- Docker 23+ for WASM vendor builds
- Rust for Tauri desktop build

## Add node and emsdk with mise-en-place

```bash
mise plugins install emsdk https://github.com/RobLoach/asdf-emsdk.git
mise install
```

## Getting started

```bash
pnpm install
pnpm -F @pdfly/wasm build   # or: pnpm build
pnpm dev
```

If you want to prefetch the pinned upstream sources without building yet:

```bash
pnpm -F @pdfly/wasm vendor:sync
```

Consumers installing **`@pdfly/wasm` from npm:** [packages/pdfly-wasm/README.md](packages/pdfly-wasm/README.md).

## Commands

```bash
pnpm dev                              # web
pnpm build                            # turbo
pnpm -F @pdfly/wasm build             # WASM + lib only
pnpm -F @pdfly/wasm vendor:sync       # fetch pinned qpdf + ghostpdl sources
pnpm -F @pdfly/wasm build:qpdf:dev    # qpdf WASM debug-ish Docker build
pnpm -F @pdfly/wasm build:qpdf:prd    # qpdf WASM optimized Docker build
pnpm -F @pdfly/wasm build:ghostscript:dev   # Ghostscript WASM spike via Docker
pnpm -F @pdfly/wasm build:ghostscript:prd   # optimized Ghostscript WASM spike via Docker
pnpm -F pdfly-desktop run tauri dev   # desktop
pnpm check                            # types, lint, tests, format
pnpm validate
```

`pnpm -F <pkg> <script>` — packages include `web`, `@pdfly/wasm`, `pdfly-desktop`. See [pnpm-workspace.yaml](pnpm-workspace.yaml).

## Ghostscript WASM Spike

The first Ghostscript milestone is Docker-first and file-based, similar to the build orchestration used by `ffmpeg.wasm`.

- source: pinned archive synced into `vendor/ghostpdl`
- toolchain: `emscripten/emsdk` inside Docker
- output: `packages/pdfly-wasm/build/ghostscript`
- current goal: produce `ghostscript.js` + `ghostscript.wasm` that can later be driven through Emscripten FS and CLI-style args

This is intentionally separate from the qpdf build and does not yet expose a public TypeScript API. The flow is Dockerfile-centric, and both upstream engines now follow the same pinned-vendor plus Docker-build model with engine-named outputs:

- `packages/pdfly-wasm/build/qpdf`
- `packages/pdfly-wasm/build/ghostscript`

## License

[@pdfly/wasm](packages/pdfly-wasm) is **Apache-2.0** ([LICENSE](packages/pdfly-wasm/LICENSE)). **Repo:** [github.com/MatteoGauthier/qpdf-wasm](https://github.com/MatteoGauthier/qpdf-wasm)

## Todo

- [x] Setup repo (Matteo)
- [ ] CLI
- [ ] Find a strategy for updates of the qpdf library
- [x] CI
- [x] CD (Wrangler)
- [ ] Open source it
- [ ] Documentation
    - [ ] How to use it with Vite chunking
    - [ ] Extract image from PDF
- [ ] Review the code
    - [ ] WASM build
    - [ ] Library design
- [ ] Publish package
- [x] Tauri (desktop app)
- [x] Merge/fuse PDFs
- [ ] Lots of fixture tests
- [ ] Rename to Giovanni
- [ ] Make sure we cache heavily big assets.
- [ ] Fix the inconsistencies in qpdf wasm package and options of each methods, also the writerpattern is not consisten accross tool. We should make it better by having a clear optimized pipeline.
- [ ] Performance
    - [ ] Add module-level side-effect import of `pdfRenderer.client` in PDF tool routes (start pdfjs-dist download at chunk parse time, not on component mount)
    - [ ] Preload `qpdf.wasm` via `<link rel="preload" as="fetch">` in PDF tool route heads (fixed path, no hash)
    - [ ] Merge sub-1KB shared chunks into consumers
- [ ] Compression improvements
    - [ ] Image recompression pipeline — `extractImages` → `canvas.toBlob(quality)` → `pdf-lib` reinject → QPDF structural pass (~50–75% savings on image-heavy docs, no server needed)
    - [ ] MuPDF WASM (`libmupdf-wasm`, ~4 MB) — native image resampling + font subsetting in one module
    - [ ] Font subsetting via `opentype.js`/`fontkit` — strip unused glyphs from embedded fonts (lossless, 200–800 KB/font)
    - [ ] Server-side Ghostscript — `gs -dPDFSETTINGS=/ebook` endpoint for 66–80% savings; WASM path as offline/privacy fallback
    - [ ] Quality preset UI — `Lossless / Balanced / Small` once a lossy image pipeline exists
- [ ] Open Question
    - [ ] Should we rename the wasm build to as it's doing more on top of qpdf?
- [ ] WebAssembly.instantiateStreaming() to speed up
