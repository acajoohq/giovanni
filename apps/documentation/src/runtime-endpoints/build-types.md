# Endpoints by Build Type (Centralized)

This page centralizes the endpoints exposed for each build/runtime type.

## Overview

| Build Type | Package / Surface | Primary Endpoints |
| --- | --- | --- |
| WASM (Web/Node) | `@acajoo/giovanni-core` | `compressPdf`, `getAvailableCompressionEngines`, `initCompressionEngine`, `inspectPdf`, `checkPdf`, `splitPdf`, `mergePdfs`, `organizePdf`, `watermarkPdf`, `extractImages` |
| React Native JSI | `@acajoo/giovanni-react-native` + `globalThis.giovanni` | `setupGiovanni`, `getVersion`, `writePdf`, `splitPages`, `mergePdfs`, `getDocumentInfo`, `extractImages` |
| Native C FFI | `giovanni_c.h` | `giovanni_qpdf_create`, `giovanni_qpdf_destroy`, `giovanni_get_version`, `giovanni_write_options_default`, `giovanni_write_pdf`, `giovanni_split_pages`, `giovanni_merge_pdfs`, `giovanni_get_document_info`, `giovanni_buffer_free`, `giovanni_pages_free`, `giovanni_document_info_free`, `giovanni_last_error` |

## Details by Build

### 1. WASM (Web/Node)

Application import:

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

See details:

- [Core API Overview](/core-api/)

### 2. React Native JSI

Setup endpoint:

```ts
import { setupGiovanni } from "@acajoo/giovanni-react-native";
setupGiovanni();
```

Native JSI endpoints exposed on `globalThis.giovanni`:

- `getVersion()`
- `writePdf(data, opts?, password?)`
- `splitPages(data)`
- `mergePdfs(inputs)`
- `getDocumentInfo(data, password?)`
- `extractImages(data)`

See details:

- [React Native JSI Endpoints](/runtime-endpoints/jsi)

### 3. Native C FFI

C endpoints exposed by `giovanni_c.h`:

- Lifecycle: `giovanni_qpdf_create`, `giovanni_qpdf_destroy`
- Version: `giovanni_get_version`
- Write options: `giovanni_write_options_default`
- Operations: `giovanni_write_pdf`, `giovanni_split_pages`, `giovanni_merge_pdfs`, `giovanni_get_document_info`
- Memory: `giovanni_buffer_free`, `giovanni_pages_free`, `giovanni_document_info_free`
- Errors: `giovanni_last_error`

See details:

- [Native C Endpoints](/runtime-endpoints/native-c)

## Notes

- JSI endpoints are synchronous at the native bridge level.
- The TypeScript binding then exposes them via async methods.
- The Ghostscript JSI binding is declared, but the native Ghostscript JSI target is not yet fully implemented.
