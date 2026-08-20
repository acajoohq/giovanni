# Endpoints de Compression

## getAvailableCompressionEngines

```ts
function getAvailableCompressionEngines(): Array<"qpdf" | "ghostscript" | "combined">;
```

Retourne la liste des moteurs de compression pris en charge.

## initCompressionEngine

```ts
function initCompressionEngine(engine: "qpdf" | "ghostscript"): Promise<void>;
```

Pré-initialise le runtime d'un moteur de compression.

## compressPdf

```ts
function compressPdf(
    input: Uint8Array | ArrayBuffer,
    options?:
        | ({ engine?: "qpdf" } & {
              preset?: "default" | "web" | "archive";
              linearize?: boolean;
              compressionLevel?: number;
              decodeLevel?: "none" | "generalized" | "specialized" | "all";
              recompressFlate?: boolean;
              objectStreams?: "preserve" | "disable" | "generate";
              compressPages?: boolean;
              removeUnreferencedResources?: boolean;
          })
        | ({ engine: "ghostscript" } & {
              preset?: "screen" | "ebook" | "printer" | "prepress" | "default";
              pdfSettings?: "screen" | "ebook" | "printer" | "prepress" | "default";
              compatibilityLevel?: "1.3" | "1.4" | "1.5" | "1.6" | "1.7";
              colorConversionStrategy?: "LeaveColorUnchanged" | "Gray" | "RGB" | "CMYK" | "UseDeviceIndependentColor";
              downsampleColorImages?: boolean;
              downsampleGrayImages?: boolean;
              downsampleMonoImages?: boolean;
              colorImageResolution?: number;
              grayImageResolution?: number;
              monoImageResolution?: number;
              jpegQuality?: number;
          })
        | ({ engine: "combined" } & {
              // Passe Ghostscript (recompression des images), appliquée en premier.
              ghostscript?: { preset?: "screen" | "ebook" | "printer" | "prepress" | "default"; jpegQuality?: number /* ...mêmes options que le moteur ghostscript */ };
              // Passe qpdf (optimisation structurelle), appliquée sur la sortie de Ghostscript.
              qpdf?: { preset?: "default" | "web" | "archive"; linearize?: boolean /* ...mêmes options que le moteur qpdf */ };
          }),
): Promise<{
    data: Uint8Array;
    engine: "qpdf" | "ghostscript" | "combined";
    preset: "default" | "web" | "archive" | "screen" | "ebook" | "printer" | "prepress";
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    savedBytes: number;
    percentageSaved: number;
}>;
```

Exemple :

```ts
const result = await compressPdf(pdfBytes, {
    engine: "qpdf",
    preset: "web",
    linearize: true,
});
```

## Moteur combiné

`engine: "combined"` exécute d'abord la passe de sous-échantillonnage/recompression d'images de Ghostscript, puis l'optimiseur structurel de qpdf (flux d'objets, suppression des ressources non référencées, linéarisation) sur le résultat — cumulant la réduction de taille des images et la compression structurelle en un seul appel, plutôt que de devoir choisir entre les deux moteurs :

```ts
const result = await compressPdf(pdfBytes, {
    engine: "combined",
    ghostscript: { preset: "ebook" },
    qpdf: { preset: "archive" },
});
```

`result.preset` indique le preset Ghostscript utilisé, puisque c'est cette passe qui pilote l'essentiel de la réduction de taille. Les erreurs de l'une ou l'autre passe se propagent telles quelles (`GhostscriptCompressionError`/`GhostscriptValidationError` pour la passe image, ou `QpdfCompressionError`/`QpdfValidationError` pour la passe structurelle).
