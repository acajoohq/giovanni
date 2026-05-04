# Giovanni Web

Giovanni Web is the static-first React frontend for the PDF tools app. It uses TanStack Start, TanStack Router, Vite, Tailwind CSS, and the local `@pdfly/wasm` package.

## Routes

The user-facing routes are stable:

- `/`
- `/compress`
- `/split`
- `/merge`
- `/extract-images`

Route files stay thin and bind URLs to tool screens.

## Source Layout

The app keeps product components in `src/components` and domain logic in `src/lib/features`.

- `src/components/layout` - app shell and tool layout.
- `src/components/pdfTools` - PDF tool screens, preview, result tray, and tool-specific panels.
- `src/components/pdfTools/visuals` - empty-state visuals for PDF tools.
- `src/components/sidebar` - typed sidebar settings controls and sections.
- `src/components/emptyState` - reusable file drop/select empty state.
- `src/components/ui/shadcn` - shadcn primitives only.
- `src/lib/features/pdfTools/hooks` - reusable tool workflow hooks.
- `src/lib/features/pdfTools/utils` - pure file, filename, metric, ZIP, and download helpers.

Folders use camelCase/PascalCase naming in app-owned areas. The only `ui` subtree is `ui/shadcn`.

## Imports

Use the `@/*` alias for source imports instead of long relative paths. The alias is configured in `vite.config.ts`, `tsconfig.json`, and `components.json`.

Examples:

```ts
import { ToolLayout } from "@/components/layout/ToolLayout";
import { useAsyncToolJob } from "@/lib/features/pdfTools/hooks/useAsyncToolJob";
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
