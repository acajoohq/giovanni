# splitPdf Endpoint

## splitPdf

```ts
function splitPdf(input: Uint8Array | ArrayBuffer): Promise<{
    pages: Uint8Array[];
    pageCount: number;
}>;
```

Splits one PDF into one PDF per page.

Example:

```ts
const result = await splitPdf(pdfBytes);
console.log(result.pageCount);
const firstPagePdf = result.pages[0];
```
