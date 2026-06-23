# Giovanni

Local-first PDF processing built on [qpdf](https://github.com/qpdf/qpdf) and Ghostscript, targeting WebAssembly (browser + Node.js), native C FFI, and React Native JSI. PDF bytes stay on the device.

**Layout:** [`apps/web`](apps/web) (main UI), [`apps/desktop`](apps/desktop) (Tauri), [`packages/core`](packages/core) (`@giovanni/core`), [`packages/pdf-render`](packages/pdf-render) (`@giovanni/pdf-render`, PDF.js page rasterisation). Upstream PDF engines are pinned in code and fetched inside Docker builds.

## Requirements

- Node.js 24+
- pnpm 10.33+
- Docker 23+ for WASM vendor builds
- Rust for Tauri desktop build — install via `rustup` ([instructions](apps/desktop/README.md#rust))

On Windows, use Docker Desktop with Linux containers enabled.

## Add node and emsdk with mise-en-place

```bash
mise plugins install emsdk https://github.com/RobLoach/asdf-emsdk.git
mise install
```

## Getting started

```bash
pnpm install
pnpm -F @giovanni/core build   # or: pnpm build
pnpm dev
```

The vendor contract is intentionally small:

- upstream source pins live in `packages/core/tools/vendor/upstreams.ts`
- Docker fetches those pinned archives during the build
- no manual clone or host-side vendor cache is required

Consumers installing **`@giovanni/core` from npm:** [packages/core/README.md](packages/core/README.md).

## Commands

```bash
pnpm dev                              # web
pnpm build                            # turbo
pnpm -F @giovanni/core build             # WASM + lib only
pnpm -F @giovanni/core build:wasm        # qpdf + Ghostscript WASM in parallel
pnpm -F @giovanni/core build:qpdf:dev    # qpdf WASM debug-ish Docker build
pnpm -F @giovanni/core build:qpdf:prd    # qpdf WASM optimized Docker build
pnpm -F @giovanni/core build:ghostscript:dev   # Ghostscript WASM Docker build
pnpm -F @giovanni/core build:ghostscript:prd   # optimized Ghostscript WASM Docker build
pnpm build:desktop                    # Tauri desktop app
pnpm check                            # types, lint, tests, format
pnpm validate
```

`pnpm -F <pkg> <script>` — packages include `web`, `@giovanni/core`, `desktop`. See [pnpm-workspace.yaml](pnpm-workspace.yaml).

## License

[@giovanni/core](packages/core) is **Apache-2.0** ([LICENSE](packages/core/LICENSE)). **Repo:** [github.com/acajoohq/giovanni](https://github.com/acajoohq/giovanni)

## Todo

- [x] Setup repo (Matteo)
- [ ] CLI
- [ ] Find a strategy for updates of the qpdf library
- [x] CI
- [x] CD (Wrangler)
- [x] Open source it
- [ ] Documentation
    - [ ] How to use it with Vite chunking
    - [x] Extract image from PDF
- [ ] Review the code
    - [ ] WASM build
    - [ ] Library design
- [ ] Publish package
- [x] Tauri (desktop app)
- [x] Merge/fuse PDFs
- [ ] Lots of fixture tests
- [x] Rename to Giovanni
- [ ] Make sure we cache heavily big assets.
- [ ] Fix the inconsistencies in qpdf wasm package and options of each methods, also the writerpattern is not consisten accross tool. We should make it better by having a clear optimized pipeline.
- [ ] Performance
    - [ ] Add module-level side-effect import of the PDF-to-JPG client module in PDF tool routes (start `@giovanni/pdf-render` / `pdfjs-dist` download at chunk parse time, not on component mount)
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
