# Pdfly

Local-first PDF tools on [qpdf](https://github.com/qpdf/qpdf) + WebAssembly. PDF bytes stay on the device.

**Layout:** [`apps/web`](apps/web) (main UI), [`apps/pdfly-desktop`](apps/pdfly-desktop) (Tauri), [`packages/pdfly-wasm`](packages/pdfly-wasm) (`@pdfly/wasm`), [`packages/pdfly-ui`](packages/pdfly-ui). Clone qpdf into `vendor/qpdf` (gitignored) to build WASM.

## Requirements

- Node.js 24+
- pnpm 10.33+
- Git
- `vendor/qpdf` (clone in Setup)
- Emscripten (`emcc`, `emcmake`, `emmake` on PATH) for `@pdfly/wasm` WASM build
- CMake
- Bash (WASM build script); on Windows use `packages/pdfly-wasm/wasm/build.ps1`
- Rust for Tauri desktop build

## Add node and emsdk with mise-en-place

```bash
mise plugins install emsdk https://github.com/RobLoach/asdf-emsdk.git
mise install
```

## Getting started

```bash
pnpm install
git clone https://github.com/qpdf/qpdf.git vendor/qpdf
pnpm -F @pdfly/wasm build   # or: pnpm build
pnpm dev
```

Consumers installing **`@pdfly/wasm` from npm:** [packages/pdfly-wasm/README.md](packages/pdfly-wasm/README.md).

## Commands

```bash
pnpm dev                              # web
pnpm build                            # turbo
pnpm -F @pdfly/wasm build             # WASM + lib only
pnpm -F pdfly-desktop run tauri dev   # desktop
pnpm check                            # types, lint, tests, format
pnpm validate
```

`pnpm -F <pkg> <script>` — packages include `web`, `@pdfly/wasm`, `pdfly-desktop`. See [pnpm-workspace.yaml](pnpm-workspace.yaml).

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
- [ ] Open Question
    - [ ] Should we rename the wasm build to as it's doing more on top of qpdf?
