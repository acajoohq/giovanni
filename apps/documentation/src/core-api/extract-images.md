# extractImages Endpoint

## extractImages

```ts
function extractImages(input: Uint8Array | ArrayBuffer): Promise<{
  images: Array<{
    objectKey: string;
    xobjectKey: string;
    pageIndex: number;
    filter: string;
    width: number;
    height: number;
    bitsPerComponent: number;
    colorSpace: string;
    components: 0 | 1 | 3 | 4;
    pixelColorModel: "unknown" | "gray" | "rgb" | "cmyk";
    hasMask: boolean;
    hasSMask: boolean;
    isImageMask: boolean;
    bytes: Uint8Array;
    blob: Blob | null;
    mimeType: string | null;
    unsupportedReason?: string;
  }>;
  imageCount: number;
}>;
```

Extracts embedded raster images from a PDF and returns metadata plus image payloads.

Example:

```ts
const { images } = await extractImages(pdfBytes);
for (const image of images) {
  if (image.blob) {
    const url = URL.createObjectURL(image.blob);
    console.log(url);
  }
}
```