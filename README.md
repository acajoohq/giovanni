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
- [ ] Tauri (desktop app)
- [ ] Merge/fuse PDFs
- [ ] Lots of fixture tests (runned on demand)
