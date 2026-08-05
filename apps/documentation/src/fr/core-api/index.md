# Vue d'ensemble de l'API Core

Ces endpoints sont exportés par `@acajoo/giovanni-core` et constituent la surface d'API principale, orientée tâches.

## Import

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

## Endpoints

- [Compression](/fr/core-api/compress)
- [Inspecter et Vérifier](/fr/core-api/inspect-check)
- [Diviser](/fr/core-api/split)
- [Fusionner](/fr/core-api/merge)
- [Organiser](/fr/core-api/organize)
- [Filigrane](/fr/core-api/watermark)
- [Extraction d'Images](/fr/core-api/extract-images)

## Type d'Entrée Commun

La plupart des endpoints acceptent `Uint8Array | ArrayBuffer` en entrée PDF.

```ts
type PdfInput = Uint8Array | ArrayBuffer;
```

## Endpoints Spécifiques au Runtime

Pour les contrats de bridge runtime (React Native JSI et C FFI natif), voir :

- [Vue d'ensemble des Runtime Endpoints](/fr/runtime-endpoints/)
- [React Native JSI Endpoints](/fr/runtime-endpoints/jsi)
- [Native C Endpoints](/fr/runtime-endpoints/native-c)
