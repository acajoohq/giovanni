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
    },
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

## watermarkTextPdf

```ts
function watermarkTextPdf(
    input: Uint8Array | ArrayBuffer,
    options: {
        password?: string;
        text: string;
        fontSize?: number;
        opacity?: number;
        angle?: number;
        placement?: "overlay" | "underlay";
        pages?: number[];
        pattern?: "single" | "tile";
    },
): Promise<{
    data: Uint8Array;
    pageCount: number;
    watermarkedPageCount: number;
    placement: "overlay" | "underlay";
}>;
```

Generates a text watermark internally and applies it to selected or all pages of the input PDF, without needing a pre-built watermark PDF.

- `text` watermark text. Non-ASCII characters are stripped; defaults to `"CONFIDENTIAL"` if left blank.
- `fontSize` font size in points, clamped to `8`–`200`. Defaults to `64`.
- `opacity` fill/stroke opacity from `0` (fully transparent) to `1` (fully opaque). Defaults to `0.15`.
- `angle` counter-clockwise rotation angle in degrees. Defaults to `45`.
- `pattern` layout pattern: `"tile"` repeats the text in a staggered grid across the page, `"single"` places one centred instance. Defaults to `"tile"`.
- `placement` and `pages` behave the same as in [`watermarkPdf`](#watermarkpdf).

Example:

```ts
const result = await watermarkTextPdf(pdfBytes, {
    text: "DRAFT",
    fontSize: 80,
    opacity: 0.2,
    angle: 30,
    pattern: "tile",
});
```
