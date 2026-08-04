# React Native JSI Endpoints

The React Native package exposes a setup endpoint and binds to native JSI globals.

## JS Setup Endpoint

From `@acajoo/giovanni-react-native`:

```ts
function setupGiovanni(): void;
```

Call once at startup to register JSI bindings with `@acajoo/giovanni-core`.

```ts
import { setupGiovanni } from "@acajoo/giovanni-react-native";

setupGiovanni();
```

## Native JSI Global Endpoints

After `giovanni::jsi::install(rt)`, `globalThis.giovanni` exposes synchronous endpoints:

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

- JSI endpoints are synchronous at the native bridge level.
- `@acajoo/giovanni-core` wraps these in async binding methods.
- `watermarkPdf` is checked by the TypeScript JSI binding but may not be available in every native bridge build.
- Ghostscript JSI binding is declared, but the native Ghostscript JSI target is not yet fully implemented.