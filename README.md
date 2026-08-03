# Giovanni

Local-first PDF processing built on [qpdf](https://github.com/qpdf/qpdf) and Ghostscript, targeting WebAssembly (browser + Node.js), native C FFI, and React Native JSI. PDF bytes stay on the device.

**Layout:** [`apps/web`](apps/web) (main UI), [`apps/desktop`](apps/desktop) (Tauri), [`packages/core`](packages/core) (`@acajoo/giovanni-core`), [`packages/pdf-render`](packages/pdf-render) (`@acajoo/giovanni-pdf-render`, PDF.js page rasterisation). Upstream PDF engines are pinned in code and fetched inside Docker builds.

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
pnpm -F @acajoo/giovanni-core build   # or: pnpm build
pnpm dev
```

The vendor contract is intentionally small:

- upstream source pins live in `packages/core/tools/vendor/upstreams.ts`
- Docker fetches those pinned archives during the build
- no manual clone or host-side vendor cache is required

Consumers installing **`@acajoo/giovanni-core` from npm:** [packages/core/README.md](packages/core/README.md).

## Commands

```bash
pnpm dev                              # web
pnpm build                            # turbo
pnpm -F @acajoo/giovanni-core build             # WASM + lib only
pnpm -F @acajoo/giovanni-core build:wasm        # qpdf + Ghostscript WASM in parallel
pnpm -F @acajoo/giovanni-core build:qpdf:dev    # qpdf WASM debug-ish Docker build
pnpm -F @acajoo/giovanni-core build:qpdf:prd    # qpdf WASM optimized Docker build
pnpm -F @acajoo/giovanni-core build:ghostscript:dev   # Ghostscript WASM Docker build
pnpm -F @acajoo/giovanni-core build:ghostscript:prd   # optimized Ghostscript WASM Docker build
pnpm build:desktop                    # Tauri desktop app
pnpm check                            # types, lint, tests, format
pnpm validate
```

`pnpm -F <pkg> <script>` — packages include `web`, `@acajoo/giovanni-core`, `desktop`. See [pnpm-workspace.yaml](pnpm-workspace.yaml).

## Releases

Publishing to npm is automated with [Changesets](https://github.com/changesets/changesets) ([.github/workflows/release.yml](.github/workflows/release.yml)), scoped to **`@acajoo/giovanni-core` only** — `@acajoo/giovanni-pdf-render` and `@acajoo/giovanni-react-native` are excluded via `.changeset/config.json`'s `ignore` list until they're ready to ship.

1. On a PR that changes `@acajoo/giovanni-core`, run `pnpm changeset` and describe the change + bump type (patch/minor/major). Commit the generated `.changeset/*.md` file.
2. Merging to `master` makes the release workflow open/update a **"chore: version packages"** PR that bumps `@acajoo/giovanni-core`'s version and changelog.
3. Merging _that_ PR triggers the workflow again, which builds (WASM included) and runs `changeset publish`.

## License

[@acajoo/giovanni-core](packages/core) is **Apache-2.0** ([LICENSE](packages/core/LICENSE)). **Repo:** [github.com/acajoohq/giovanni](https://github.com/acajoohq/giovanni)
