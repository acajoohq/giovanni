# Endpoint watermarkPdf

## watermarkPdf

```ts
function watermarkPdf(
  input: Uint8Array | ArrayBuffer,
  options: {
    password?: string;
    watermark: Uint8Array | ArrayBuffer;
    placement?: "overlay" | "underlay";
    pages?: number[];
    watermarkPassword?: string;
  }
): Promise<{
  data: Uint8Array;
  pageCount: number;
  watermarkedPageCount: number;
  placement: "overlay" | "underlay";
}>;
```

Applique la première page d'un PDF de filigrane aux pages sélectionnées ou à toutes les pages du PDF d'entrée.

Exemple :

```ts
const result = await watermarkPdf(pdfBytes, {
  watermark: stampBytes,
  placement: "overlay",
});
```
