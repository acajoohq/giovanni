# Pdfly

Local-first PDF tooling: a Vite demo ([`apps/pdfly-web`](apps/pdfly-web)), a qpdf + WebAssembly package ([`@pdfly/wasm`](packages/pdfly-wasm)), and a local [qpdf](https://github.com/qpdf/qpdf) clone under `vendor/qpdf` for the WASM build. Processing stays on the device.

**Node 22.12+** and **pnpm 10.33+** (see root `package.json`).

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

| Task | Command |
|------|---------|
| Test / watch | `pnpm test` / `pnpm test:watch` |
| Typecheck, lint, format | `pnpm typecheck` · `pnpm lint` · `pnpm format` / `pnpm format:check` |

**pnpm workspace:** `pnpm -F <name> <script>` runs a script in one package (`pdfly-web`, `@pdfly/wasm`). `pnpm -r <script>` runs it everywhere it exists. Globs: `pnpm-workspace.yaml`.

**Stack:** oxfmt, oxlint, Turbo.

## License

[@pdfly/wasm](packages/pdfly-wasm) is **Apache-2.0** ([license](packages/pdfly-wasm/LICENSE)). qpdf is a separate project.

**Repo:** [github.com/MatteoGauthier/qpdf-wasm](https://github.com/MatteoGauthier/qpdf-wasm)

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
