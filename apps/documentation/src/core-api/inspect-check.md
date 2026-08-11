# Inspect and Check Endpoints

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

Returns document metadata for a PDF.

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

Performs a validity check and returns warnings for recoverable PDF issues.

Example:

```ts
const inspection = await inspectPdf(pdfBytes);
const check = await checkPdf(pdfBytes);
```
