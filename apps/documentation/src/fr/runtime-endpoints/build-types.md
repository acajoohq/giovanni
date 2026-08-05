# Endpoints Centralisés par Type de Build

Cette page centralise les endpoints exposés pour chaque type de build/runtime.

## Vue d'ensemble

| Type de build    | Package / Surface                                       | Endpoints principaux                                                                                                                                                                                                                                                                                              |
| ---------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WASM (Web/Node)  | `@acajoo/giovanni-core`                                 | `compressPdf`, `getAvailableCompressionEngines`, `initCompressionEngine`, `inspectPdf`, `checkPdf`, `splitPdf`, `mergePdfs`, `organizePdf`, `watermarkPdf`, `extractImages`                                                                                                                                       |
| React Native JSI | `@acajoo/giovanni-react-native` + `globalThis.giovanni` | `setupGiovanni`, `getVersion`, `writePdf`, `splitPages`, `mergePdfs`, `getDocumentInfo`, `extractImages`                                                                                                                                                                                                          |
| Native C FFI     | `giovanni_c.h`                                          | `giovanni_qpdf_create`, `giovanni_qpdf_destroy`, `giovanni_get_version`, `giovanni_write_options_default`, `giovanni_write_pdf`, `giovanni_split_pages`, `giovanni_merge_pdfs`, `giovanni_get_document_info`, `giovanni_buffer_free`, `giovanni_pages_free`, `giovanni_document_info_free`, `giovanni_last_error` |

## Détails par Build

### 1. WASM (Web/Node)

Import applicatif :

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

Voir le détail :

- [Vue d'ensemble de l'API Core](/fr/core-api/)

### 2. React Native JSI

Endpoint de setup :

```ts
import { setupGiovanni } from "@acajoo/giovanni-react-native";
setupGiovanni();
```

Endpoints natifs JSI exposés sur `globalThis.giovanni` :

- `getVersion()`
- `writePdf(data, opts?, password?)`
- `splitPages(data)`
- `mergePdfs(inputs)`
- `getDocumentInfo(data, password?)`
- `extractImages(data)`

Voir le détail :

- [React Native JSI Endpoints](/fr/runtime-endpoints/jsi)

### 3. Native C FFI

Endpoints C exposés par `giovanni_c.h` :

- Lifecycle : `giovanni_qpdf_create`, `giovanni_qpdf_destroy`
- Version : `giovanni_get_version`
- Options d'écriture : `giovanni_write_options_default`
- Opérations : `giovanni_write_pdf`, `giovanni_split_pages`, `giovanni_merge_pdfs`, `giovanni_get_document_info`
- Mémoire : `giovanni_buffer_free`, `giovanni_pages_free`, `giovanni_document_info_free`
- Erreurs : `giovanni_last_error`

Voir le détail :

- [Native C Endpoints](/fr/runtime-endpoints/native-c)

## Notes

- Les endpoints JSI sont synchrones au niveau du bridge natif.
- Le binding TypeScript les expose ensuite via des méthodes async.
- Le binding Ghostscript JSI est déclaré, mais la cible native Ghostscript JSI n'est pas encore complètement implémentée.
