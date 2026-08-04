# watermarkPdf Endpoint

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

Applies the first page of a watermark PDF to selected or all pages of the input PDF.

Example:

```ts
const result = await watermarkPdf(pdfBytes, {
  watermark: stampBytes,
  placement: "overlay",
});
```