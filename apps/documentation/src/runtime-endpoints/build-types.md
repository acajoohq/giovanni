# Endpoints Centralises Par Type De Build

Cette page centralise les endpoints exposes selon le type de build/runtime.

## Vue D Ensemble

| Type de build | Package / Surface | Endpoints principaux |
| --- | --- | --- |
| WASM (Web/Node) | `@acajoo/giovanni-core` | `compressPdf`, `getAvailableCompressionEngines`, `initCompressionEngine`, `inspectPdf`, `checkPdf`, `splitPdf`, `mergePdfs`, `organizePdf`, `watermarkPdf`, `extractImages` |
| React Native JSI | `@acajoo/giovanni-react-native` + `globalThis.giovanni` | `setupGiovanni`, `getVersion`, `writePdf`, `splitPages`, `mergePdfs`, `getDocumentInfo`, `extractImages` |
| Native C FFI | `giovanni_c.h` | `giovanni_qpdf_create`, `giovanni_qpdf_destroy`, `giovanni_get_version`, `giovanni_write_options_default`, `giovanni_write_pdf`, `giovanni_split_pages`, `giovanni_merge_pdfs`, `giovanni_get_document_info`, `giovanni_buffer_free`, `giovanni_pages_free`, `giovanni_document_info_free`, `giovanni_last_error` |

## Details Par Build

### 1. WASM (Web/Node)

Import applicatif:

```ts
import {
  compressPdf,
  getAvailableCompressionEngines,
  initCompressionEngine,
  inspectPdf,
  checkPdf,
  splitPdf,
  mergePdfs,
  organizePdf,
  watermarkPdf,
  extractImages,
} from "@acajoo/giovanni-core";
```

Voir le detail:

- [Core API Overview](/core-api/)

### 2. React Native JSI

Endpoint de setup:

```ts
import { setupGiovanni } from "@acajoo/giovanni-react-native";
setupGiovanni();
```

Endpoints natifs JSI exposes sur `globalThis.giovanni`:

- `getVersion()`
- `writePdf(data, opts?, password?)`
- `splitPages(data)`
- `mergePdfs(inputs)`
- `getDocumentInfo(data, password?)`
- `extractImages(data)`

Voir le detail:

- [React Native JSI Endpoints](/runtime-endpoints/jsi)

### 3. Native C FFI

Endpoints C exposes par `giovanni_c.h`:

- Lifecycle: `giovanni_qpdf_create`, `giovanni_qpdf_destroy`
- Version: `giovanni_get_version`
- Write options: `giovanni_write_options_default`
- Operations: `giovanni_write_pdf`, `giovanni_split_pages`, `giovanni_merge_pdfs`, `giovanni_get_document_info`
- Memory: `giovanni_buffer_free`, `giovanni_pages_free`, `giovanni_document_info_free`
- Errors: `giovanni_last_error`

Voir le detail:

- [Native C Endpoints](/runtime-endpoints/native-c)

## Notes

- Les endpoints JSI sont synchrones au niveau bridge natif.
- Le binding TypeScript les expose ensuite via des methodes async.
- Le binding Ghostscript JSI est declare mais le target natif Ghostscript JSI n est pas encore completement implemente.