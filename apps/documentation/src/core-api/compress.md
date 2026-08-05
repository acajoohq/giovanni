# Compression Endpoints

## getAvailableCompressionEngines

```ts
function getAvailableCompressionEngines(): Array<"qpdf" | "ghostscript">;
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
          }),
): Promise<{
    data: Uint8Array;
    engine: "qpdf" | "ghostscript";
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
