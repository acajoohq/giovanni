# Giovanni

Local-first PDF tools on [qpdf](https://github.com/qpdf/qpdf) + WebAssembly. PDF bytes stay on the device.

**Layout:** [`apps/web`](apps/web) (main UI), [`apps/desktop`](apps/desktop) (Tauri), [`packages/pdfly-wasm`](packages/pdfly-wasm) (`@pdfly/wasm`), [`packages/pdfly-pdf-render`](packages/pdfly-pdf-render) (`@pdfly/pdf-render`, PDF.js page rasterisation). Upstream PDF engines are pinned in code and fetched inside Docker builds.

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
pnpm -F @pdfly/wasm build   # or: pnpm build
pnpm dev
```

The vendor contract is intentionally small:

- upstream source pins live in `packages/pdfly-wasm/tools/vendor/upstreams.ts`
- Docker fetches those pinned archives during the build
- no manual clone or host-side vendor cache is required

Consumers installing **`@pdfly/wasm` from npm:** [packages/pdfly-wasm/README.md](packages/pdfly-wasm/README.md).

## Commands

```bash
pnpm dev                              # web
pnpm build                            # turbo
pnpm -F @pdfly/wasm build             # WASM + lib only
pnpm -F @pdfly/wasm build:wasm        # qpdf + Ghostscript WASM in parallel
pnpm -F @pdfly/wasm build:qpdf:dev    # qpdf WASM debug-ish Docker build
pnpm -F @pdfly/wasm build:qpdf:prd    # qpdf WASM optimized Docker build
pnpm -F @pdfly/wasm build:ghostscript:dev   # Ghostscript WASM Docker build
pnpm -F @pdfly/wasm build:ghostscript:prd   # optimized Ghostscript WASM Docker build
pnpm build:desktop                    # Tauri desktop app
pnpm check                            # types, lint, tests, format
pnpm validate
```

`pnpm -F <pkg> <script>` — packages include `web`, `@pdfly/wasm`, `desktop`. See [pnpm-workspace.yaml](pnpm-workspace.yaml).

## Ghostscript WASM Spike

The Ghostscript build is Docker-first, similar to the build orchestration used by `ffmpeg.wasm`.

- source: pinned archive fetched inside the Docker build
- toolchain: `emscripten/emsdk` inside Docker
- output: `packages/pdfly-wasm/build/ghostscript`
- native wrapper: `gsapi_*` exposed through a narrow Emscripten binding (`rewritePdf`, version)

The lower-level Ghostscript runtime remains internal, but the package now exposes an engine-aware `compressPdf(...)` facade above qpdf and Ghostscript. The flow is Dockerfile-centric, the default `pnpm -F @pdfly/wasm build` path builds both engines, and both upstream engines now follow the same pinned-source plus Docker-build model with engine-named outputs:

- `packages/pdfly-wasm/build/qpdf`
- `packages/pdfly-wasm/build/ghostscript`

Build notes:

- `build:wasm` now runs qpdf and Ghostscript in parallel
- local BuildKit cache reuse is automatic when the active `docker buildx` driver supports local cache export
- GitHub Actions now uses the same Docker-native vendor build path instead of bootstrapping `emsdk` and vendoring sources on the host

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
    - [ ] Add module-level side-effect import of the PDF-to-JPG client module in PDF tool routes (start `@pdfly/pdf-render` / `pdfjs-dist` download at chunk parse time, not on component mount)
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
