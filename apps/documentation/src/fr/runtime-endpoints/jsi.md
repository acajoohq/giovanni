# React Native JSI Endpoints

Le package React Native expose un endpoint de setup et se lie aux globales JSI natives.

## Endpoint de Setup JS

Depuis `@acajoo/giovanni-react-native` :

```ts
function setupGiovanni(): void;
```

À appeler une seule fois au démarrage pour enregistrer les bindings JSI auprès de `@acajoo/giovanni-core`.

```ts
import { setupGiovanni } from "@acajoo/giovanni-react-native";

setupGiovanni();
```

## Endpoints Globaux JSI Natifs

Après `giovanni::jsi::install(rt)`, `globalThis.giovanni` expose des endpoints synchrones :

```ts
giovanni.getVersion(): string;

giovanni.writePdf(
  input: Uint8Array | ArrayBuffer,
  options?: {
    compressionLevel?: number;
    recompressFlate?: boolean;
    decodeLevel?: "none" | "generalized" | "specialized" | "all";
    objectStreams?: "preserve" | "disable" | "generate";
    compressPages?: boolean;
    removeUnreferencedResources?: boolean;
    linearize?: boolean;
  },
  password?: string
): ArrayBuffer;

giovanni.splitPages(input: Uint8Array | ArrayBuffer): ArrayBuffer[];

giovanni.mergePdfs(inputs: Array<Uint8Array | ArrayBuffer>): ArrayBuffer;

giovanni.getDocumentInfo(input: Uint8Array | ArrayBuffer, password?: string): {
  numPages: number;
  pdfVersion: string;
  isEncrypted: boolean;
  isLinearized: boolean;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
};

giovanni.extractImages(input: Uint8Array | ArrayBuffer): Array<{
  objectKey: string;
  xobjectKey: string;
  pageIndex: number;
  filter: string;
  width: number;
  height: number;
  bitsPerComponent: number;
  colorSpace: string;
  components: number;
  pixelColorModel: string;
  hasMask: boolean;
  hasSMask: boolean;
  isImageMask: boolean;
  strategy: string;
  bytes: ArrayBuffer;
}>;
```

## Notes

- Les endpoints JSI sont synchrones au niveau du bridge natif.
- `@acajoo/giovanni-core` les encapsule dans des méthodes de binding asynchrones.
- `watermarkPdf` est vérifié par le binding TypeScript JSI mais peut ne pas être disponible dans toutes les builds de bridge natif.
- Le binding Ghostscript JSI est déclaré, mais la cible native Ghostscript JSI n'est pas encore complètement implémentée.
