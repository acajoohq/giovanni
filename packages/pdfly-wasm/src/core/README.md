# Core Layout

This directory is split by concern, not by feature sprawl.

- top-level `core/*.ts`
  Public PDF operations and shared error types

- `core/qpdf/*`
  qpdf-specific runtime pieces: module loader and compression engine adapter

- `core/ghostscript/*`
  Ghostscript-specific runtime pieces: module loader, runtime execution, option mapping, rewrite flow, and engine adapter

- `core/compression/*`
  engine-neutral compression contract and engine registry

- `core/shared/*`
  shared low-level helpers reused by multiple engines

Rule of thumb:

- if code is qpdf-only, keep it in `core/qpdf/`
- if code is Ghostscript-only, keep it in `core/ghostscript/`
- if code dispatches across engines, keep it in `core/compression/`
- if code is a user-facing operation, keep it at `core/*.ts`
