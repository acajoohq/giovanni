# Pdfly

A local-first [monorepo](https://pnpm.io/workspaces) for PDF tooling: a browser demo app, a [qpdf](https://qpdf.sourceforge.io/)-backed [WebAssembly](https://webassembly.org/) package, and the upstream source layout needed to build the WASM binary.

All PDF work happens on the device. Nothing is sent to a server as part of the libraries here.

## What’s in the repo

| Path | Description |
|------|-------------|
| [`apps/pdfly-web`](apps/pdfly-web) | [Vite](https://vitejs.dev/) demo that exercises `@pdfly/wasm` in the browser. |
| [`packages/pdfly-wasm`](packages/pdfly-wasm) | npm package **`@pdfly/wasm`**: TypeScript API over qpdf compiled to `.wasm` (compression, page split, and lower-level `QPDF` / `QPDFWriter` access). |
| `vendor/qpdf` | [qpdf](https://github.com/qpdf/qpdf) source used by the Emscripten build. **Not** committed; you clone it locally (see [Setup](#setup)). |

For install flags, API examples, and package layout, see the [pdfly-wasm README](packages/pdfly-wasm/README.md).

## Requirements

- [Node.js](https://nodejs.org/) **22.12+** (see root `package.json` `engines`).
- [pnpm](https://pnpm.io/) **10.33+** (see `packageManager` in root `package.json`).

## Setup

```bash
pnpm install
git clone https://github.com/qpdf/qpdf.git vendor/qpdf
```

The WASM build reads qpdf from `vendor/qpdf`. Without it, `@pdfly/wasm`’s `build:wasm` step will fail.

## Development

**Run the web app** (watches the demo; Turbo filters to `pdfly-web`):

```bash
pnpm dev
```

**Build everything** the workspace knows about (dependency order is handled by [Turbo](https://turbo.build/)):

```bash
pnpm build
```

**Work on the library only** (after `vendor/qpdf` exists):

```bash
pnpm --filter @pdfly/wasm build
pnpm --filter @pdfly/wasm test
```

## Commands

| Command | Purpose |
|--------|---------|
| `pnpm dev` | Start `pdfly-web` in dev mode. |
| `pnpm build` | Production build for all packages that define `build`. |
| `pnpm test` / `pnpm test:watch` | Run tests (and watch) via Turbo. |
| `pnpm typecheck` | Type-check across the workspace. |
| `pnpm lint` | Lint across the workspace. |
| `pnpm format` / `pnpm format:check` | Format with [oxfmt](https://oxc.rs) or verify formatting. |
| `pnpm check` | `typecheck` + `lint` + `test` + `format:check` (full pre-push style gate). |
| `pnpm validate` | Turbo `validate` (package checks; **depends on a successful `build`**). |

`pnpm clean` runs `turbo clean` for tasks that support it.

## Tooling

- **Formatter:** [oxfmt](https://github.com/oxc-project/oxc) (`.oxfmtrc.json`).
- **Linter:** [oxlint](https://oxc.rs) (`.oxlintrc.json`).
- **Orchestration:** Turbo (`turbo.json`).

Build artifacts under `dist/` and similar are generated and gitignored; they can be reproduced from source.

## License and upstream

The published library [@pdfly/wasm](packages/pdfly-wasm) is **Apache-2.0**; see [packages/pdfly-wasm/LICENSE](packages/pdfly-wasm/LICENSE). qpdf is a separate project with its own licensing; this repo vendors its source only for the WASM build.

**Issues and source:** [github.com/MatteoGauthier/qpdf-wasm](https://github.com/MatteoGauthier/qpdf-wasm) (as referenced from the package metadata).

## Todo

- [ ] Choose the outputs of the lib
- [ ] Find a strategy for updates of the qpdf library
- [ ] CI / CD
- [ ] Open source it
- [ ] Documentation
  - [ ] How to use it with Vite chunking
- [ ] Review the code
  - [ ] WASM build
  - [ ] Library design
- [ ] Publish package
