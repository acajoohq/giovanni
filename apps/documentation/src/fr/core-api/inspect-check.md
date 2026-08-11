# Endpoints Inspecter et Vérifier

## inspectPdf

```ts
function inspectPdf(
    input: Uint8Array | ArrayBuffer,
    options?: { password?: string },
): Promise<{
    numPages: number;
    pdfVersion: string;
    isEncrypted: boolean;
    isLinearized: boolean;
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
}>;
```

Retourne les métadonnées d'un document PDF.

## checkPdf

```ts
function checkPdf(
    input: Uint8Array | ArrayBuffer,
    options?: { password?: string },
): Promise<{
    info: {
        numPages: number;
        pdfVersion: string;
        isEncrypted: boolean;
        isLinearized: boolean;
    };
    isValid: boolean;
    warnings: string[];
}>;
```

Effectue un contrôle de validité et retourne des avertissements pour les problèmes de PDF récupérables.

Exemple :

```ts
const inspection = await inspectPdf(pdfBytes);
const check = await checkPdf(pdfBytes);
```
