# Endpoint organizePdf

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

Réorganise, duplique ou supprime des pages à partir d'indices commençant à zéro.

Exemple :

```ts
const reorganized = await organizePdf(pdfBytes, { pages: [2, 1, 0] });
console.log(reorganized.pageCount);
```
