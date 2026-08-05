# organizePdf Endpoint

## organizePdf

```ts
function organizePdf(
    input: Uint8Array | ArrayBuffer,
    options: {
        password?: string;
        pages: number[];
    },
): Promise<{
    data: Uint8Array;
    pageCount: number;
    originalPageCount: number;
}>;
```

Reorders, duplicates, or removes pages using zero-based indices.

Example:

```ts
const reorganized = await organizePdf(pdfBytes, { pages: [2, 1, 0] });
console.log(reorganized.pageCount);
```
