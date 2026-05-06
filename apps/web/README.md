# Web

Web is the static-first React frontend for the PDF tools app. It uses TanStack Start, TanStack Router, Vite, Tailwind CSS, and the local `@pdfly/wasm` package.

## Routes

The user-facing routes are stable:

- `/`
- `/compress`
- `/split`
- `/merge`
- `/extract-images`

Route files stay thin and bind URLs to tool screens.

## Source Layout

Product `.tsx` lives under `src/components`. Hooks and pure helpers live in top-level `src/hooks` and `src/utils`, grouped by domain (mirroring Lemni Web).

- `src/components/layout` - app shell and tool layout.
- `src/components/dialogs` - app-level dialogs such as About.
- `src/components/viewer` - before/after, comparison slider, processing placeholder.
- `src/components/pdf` - PDF tool UI: shared widgets (`PdfPreview`, `PdfFilesList`, `ResultTray`, `ExtractedImageCard`), drop-zone vignettes (`emptyState`), route-level tools (`tools`).
- `src/components/sidebar` - typed sidebar settings controls and sections.
- `src/components/emptyState` - reusable file drop/select empty state.
- `src/components/ui/shadcn` - shadcn primitives only.
- `src/hooks/pdf` - reusable tool workflow hooks.
- `src/utils/pdf` - pure file, filename, metric, ZIP, download helpers, and client-only pdf.js helpers (`pdfRenderer.client`).

Folders use camelCase/PascalCase naming in app-owned areas. The only `ui` subtree is `ui/shadcn`.

## Imports

Use the `@/*` alias for source imports instead of long relative paths. The alias is configured in `vite.config.ts`, `tsconfig.json`, and `components.json`. You may also import from `@/hooks/*` and `@/utils/*` explicitly.

Examples:

```ts
import { ToolLayout } from "@/components/layout/ToolLayout";
import { useAsyncToolJob } from "@/hooks/pdf/useAsyncToolJob";
import { filterPdfFiles } from "@/utils/pdf/pdfToolUtils";
```

## Styling

Shared colors and shadows live in `src/styles/app.css` as Tailwind v4 CSS-first tokens. Prefer tokenized utilities such as `bg-app-panel`, `border-app-border`, `text-app-text-muted`, `bg-brand`, and `shadow-result-tray` before adding new arbitrary values.

Keep the interface dense and tool-like:

- the right sidebar is for settings and read-only configuration details
- tool status, output metrics, and download actions live in the bottom result tray
- PDF processing starts from one file drop/select interaction where possible
- desktop layouts stay dense while mobile collapses into a stacked flow

## PDF Preview

`PdfPreview` is SSR-safe. Browser-only pdf.js setup, worker configuration, canvas rendering, `window`, `document`, and `ResizeObserver` live behind client-only imports so prerender does not evaluate pdf.js.

## Validation

Run these before shipping web changes:

```bash
pnpm run typecheck
pnpm run lint
pnpm run format:check
pnpm run test
pnpm run build
```

Build acceptance for PDF preview changes:

- no prerender `DOMMatrix is not defined` errors
- no pdf.js worker import warning
- no format failures

## TODOs

- [ ] Eslint rules
- [ ] unit tests
- [ ] Nice visuals / illustrations / icons / empty states
- [ ] Transitions / animations
- [ ] Tooltips
- [ ] SEO
- [ ] Use toggle instead of checkbox
- [ ] Landing page, with dropzone to have one interaction flow
- [ ] PDF JS preview, or something else but nice
- [ ] Mobile version (responsive layout — collapse resizable panels into a stacked single-panel flow on small screens)
