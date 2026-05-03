# Giovanni Web

Giovanni Web is the static-first React frontend for the app. It uses TanStack Start, TanStack Router, Vite, and Tailwind CSS.

## PDF Tool Integration

The first Giovanni phase is intentionally static. Future PDF tools should integrate directly with `@pdfly/wasm` from `packages/pdfly-wasm` and build React components around that API.

Keep `packages/pdfly-ui` in place while the desktop app still depends on its vanilla `initApp()` implementation. Do not port the old DOM ID based UI into Giovanni.

When the PDF tool phase starts, preserve the existing WASM packaging requirements:

- exclude `@pdfly/wasm` from dependency prebundling if the runtime import requires it
- copy `qpdf.wasm` into the deployed asset output where the generated qpdf loader can fetch it
- keep browser processing states explicit so users know when files stay local

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
