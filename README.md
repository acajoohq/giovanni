# Pdfly

Local-first PDF tooling: a Vite demo ([`apps/pdfly-web`](apps/pdfly-web)), a qpdf + WebAssembly package ([`@pdfly/wasm`](packages/pdfly-wasm)), and a local [qpdf](https://github.com/qpdf/qpdf) clone under `vendor/qpdf` for the WASM build. Processing stays on the device.

## Requirements

- Node.js 24+
- pnpm 10.33+
- Git
- `vendor/qpdf` (clone in Setup)
- Emscripten (`emcc`, `emcmake`, `emmake` on PATH) for `@pdfly/wasm` WASM build
- CMake
- Bash (WASM build script); on Windows use `packages/pdfly-wasm/wasm/build.ps1`

## Setup

```bash
pnpm install
git clone https://github.com/qpdf/qpdf.git vendor/qpdf
```

WASM build needs `vendor/qpdf`. API and usage: [packages/pdfly-wasm/README.md](packages/pdfly-wasm/README.md).

## Commands

```bash
pnpm dev              # pdfly-web dev server
pnpm build            # all packages (Turbo)
pnpm -F @pdfly/wasm build   # library only (needs vendor/qpdf)
pnpm check            # typecheck, lint, test, format:check
pnpm validate         # package checks; requires build first
pnpm clean
```

| Task                    | Command                                                              |
| ----------------------- | -------------------------------------------------------------------- |
| Test / watch            | `pnpm test` / `pnpm test:watch`                                      |
| Typecheck, lint, format | `pnpm typecheck` · `pnpm lint` · `pnpm format` / `pnpm format:check` |

**pnpm workspace:** `pnpm -F <name> <script>` runs a script in one package (`pdfly-web`, `@pdfly/wasm`). `pnpm -r <script>` runs it everywhere it exists. Globs: `pnpm-workspace.yaml`.

**Stack:** oxfmt, oxlint, Turbo.

## License

[@pdfly/wasm](packages/pdfly-wasm) is **Apache-2.0** ([license](packages/pdfly-wasm/LICENSE)). qpdf is a separate project.

**Repo:** [github.com/MatteoGauthier/qpdf-wasm](https://github.com/MatteoGauthier/qpdf-wasm)

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
- [ ] Merge/fuse PDFs
- [ ] Lots of fixture tests (runned on demand
- [ ] Rename to Giovanni
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

