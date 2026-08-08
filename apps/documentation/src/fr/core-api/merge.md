# Endpoint mergePdfs

## mergePdfs

```ts
function mergePdfs(inputs: Array<Uint8Array | ArrayBuffer>): Promise<{
    data: Uint8Array;
    sourceCount: number;
}>;
```

Fusionne plusieurs PDF en un seul PDF de sortie.

Exemple :

```ts
const merged = await mergePdfs([pdfA, pdfB, pdfC]);
console.log(merged.sourceCount);
```
