# Endpoint watermarkPdf

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

Applique la première page d'un PDF de filigrane aux pages sélectionnées ou à toutes les pages du PDF d'entrée.

Exemple :

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

Génère un filigrane texte en interne et l'applique aux pages sélectionnées ou à toutes les pages du PDF d'entrée, sans nécessiter de PDF de filigrane préconstruit.

- `text` texte du filigrane. Les caractères non-ASCII sont supprimés ; par défaut `"CONFIDENTIAL"` si laissé vide.
- `fontSize` taille de police en points, limitée entre `8` et `200`. Par défaut `64`.
- `opacity` opacité du remplissage/contour de `0` (totalement transparent) à `1` (totalement opaque). Par défaut `0.15`.
- `angle` angle de rotation antihoraire en degrés. Par défaut `45`.
- `pattern` motif de disposition : `"tile"` répète le texte selon une grille décalée sur la page, `"single"` place une seule instance centrée. Par défaut `"tile"`.
- `placement` et `pages` se comportent comme dans [`watermarkPdf`](#watermarkpdf).

Exemple :

```ts
const result = await watermarkTextPdf(pdfBytes, {
    text: "DRAFT",
    fontSize: 80,
    opacity: 0.2,
    angle: 30,
    pattern: "tile",
});
```
