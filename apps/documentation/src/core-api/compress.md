# Compression Endpoints

## getAvailableCompressionEngines

```ts
function getAvailableCompressionEngines(): Array<"qpdf" | "ghostscript" | "combined">;
```

Returns the list of supported compression engines.

## initCompressionEngine

```ts
function initCompressionEngine(engine: "qpdf" | "ghostscript"): Promise<void>;
```

Pre-initializes a compression engine runtime.

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
              // Ghostscript pass (image recompression), applied first.
              ghostscript?: { preset?: "screen" | "ebook" | "printer" | "prepress" | "default"; jpegQuality?: number /* ...same options as the ghostscript engine */ };
              // qpdf pass (structural optimization), applied to the Ghostscript output.
              qpdf?: { preset?: "default" | "web" | "archive"; linearize?: boolean /* ...same options as the qpdf engine */ };
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

Example:

```ts
const result = await compressPdf(pdfBytes, {
    engine: "qpdf",
    preset: "web",
    linearize: true,
});
```

## Combined engine

`engine: "combined"` runs Ghostscript's image downsample/recompress pass first, then qpdf's structural optimizer (object streams, unreferenced-resource removal, linearization) on the result — getting image size reductions and structural compression in one call, rather than picking one engine or the other:

```ts
const result = await compressPdf(pdfBytes, {
    engine: "combined",
    ghostscript: { preset: "ebook" },
    qpdf: { preset: "archive" },
});
```

`result.preset` reports the Ghostscript preset used, since it's the pass that drives most of the size reduction. Errors from either pass propagate as-is (a `GhostscriptCompressionError`/`GhostscriptValidationError` from the image pass, or a `QpdfCompressionError`/`QpdfValidationError` from the structural pass).
