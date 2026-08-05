# Endpoint splitPdf

## splitPdf

```ts
function splitPdf(input: Uint8Array | ArrayBuffer): Promise<{
  pages: Uint8Array[];
  pageCount: number;
}>;
```

Divise un PDF en un PDF par page.

Exemple :

```ts
const result = await splitPdf(pdfBytes);
console.log(result.pageCount);
const firstPagePdf = result.pages[0];
```
