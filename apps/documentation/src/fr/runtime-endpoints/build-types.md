# Endpoints Centralises Par Type De Build

Cette page centralise les endpoints exposes selon le type de build/runtime.

## Vue D Ensemble

| Type de build | Package / Surface | Endpoints principaux |
| --- | --- | --- |
| WASM (Web/Node) | `@acajoo/giovanni-core` | `compressPdf`, `getAvailableCompressionEngines`, `initCompressionEngine`, `inspectPdf`, `checkPdf`, `splitPdf`, `mergePdfs`, `organizePdf`, `watermarkPdf`, `extractImages` |
| React Native JSI | `@acajoo/giovanni-react-native` + `globalThis.giovanni` | `setupGiovanni`, `getVersion`, `writePdf`, `splitPages`, `mergePdfs`, `getDocumentInfo`, `extractImages` |
| Native C FFI | `giovanni_c.h` | `giovanni_qpdf_create`, `giovanni_qpdf_destroy`, `giovanni_get_version`, `giovanni_write_options_default`, `giovanni_write_pdf`, `giovanni_split_pages`, `giovanni_merge_pdfs`, `giovanni_get_document_info`, `giovanni_buffer_free`, `giovanni_pages_free`, `giovanni_document_info_free`, `giovanni_last_error` |

## Voir Aussi

- [API Core](/fr/core-api/)
- [React Native JSI Endpoints](/fr/runtime-endpoints/jsi)
- [Native C Endpoints](/fr/runtime-endpoints/native-c)