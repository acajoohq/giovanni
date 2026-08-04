# mergePdfs Endpoint

## mergePdfs

```ts
function mergePdfs(
  inputs: Array<Uint8Array | ArrayBuffer>
): Promise<{
  data: Uint8Array;
  sourceCount: number;
}>;
```

Merges multiple PDFs into a single output PDF.

Example:

```ts
const merged = await mergePdfs([pdfA, pdfB, pdfC]);
console.log(merged.sourceCount);
```