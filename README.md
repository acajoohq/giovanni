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

## Getting started

```bash
pnpm install
git clone https://github.com/qpdf/qpdf.git vendor/qpdf
# Install Emscripten (https://github.com/emscripten-core/emsdk), then:
source /path/to/emsdk/emsdk_env.sh
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
