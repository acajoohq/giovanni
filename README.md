# Pdfly

Local-first PDF tools powered by qpdf, WebAssembly, and Vite.

## Workspace

```text
apps/
    pdfly-web/       Vite demo app
packages/
    pdfly-wasm/      qpdf WebAssembly package
vendor/
    qpdf/            local qpdf source clone, ignored by git
```

## Setup

```bash
pnpm install
git clone https://github.com/qpdf/qpdf.git vendor/qpdf
```

## Commands

```bash
pnpm dev
pnpm build
pnpm test
pnpm typecheck
pnpm lint
pnpm format
pnpm validate
```

## Tooling

- Formatting: `.oxfmtrc.json` with `oxfmt`.
- Linting: `.oxlintrc.json` with `oxlint`.
- Task orchestration: `turbo.json` with Turbo.

Generated build output is ignored and can be recreated from source.
