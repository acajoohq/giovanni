import type { WasmExtractedImage, WasmPixelColorModel } from "../types/wasm.types.js";

// encode a raw-pixel image as a PNG Blob via canvas; null when unsupported
export async function encodeRawPixelsAsPng(image: WasmExtractedImage): Promise<Blob | null> {
    if (image.bitsPerComponent !== 8) return null;
    if (image.width <= 0 || image.height <= 0) return null;

    const components = pixelColorModelComponents(image.pixelColorModel);
    if (components === null) return null;

    const expectedByteLength = image.width * image.height * components;
    if (image.bytes.length < expectedByteLength) return null;

    const rgba = expandToRgba(image.bytes, image.width, image.height, image.pixelColorModel);
    if (!rgba) return null;

    const canvas = createCanvas(image.width, image.height);
    if (!canvas) return null;

    const context = canvas.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
    if (!context) return null;

    const imageData = createImageData(rgba, image.width, image.height);
    if (!imageData) return null;

    context.putImageData(imageData, 0, 0);

    if (typeof OffscreenCanvas !== "undefined" && canvas instanceof OffscreenCanvas) {
        return canvas.convertToBlob({ type: "image/png" });
    }

    return new Promise<Blob | null>((resolve) => {
        (canvas as HTMLCanvasElement).toBlob((blob) => resolve(blob), "image/png");
    });
}

// human-readable reason that encodeRawPixelsAsPng declined to encode the image
export function rawPixelUnsupportedReason(image: WasmExtractedImage): string {
    if (typeof OffscreenCanvas === "undefined" && typeof document === "undefined") {
        return "Raw-pixel images need a browser canvas to be encoded as PNG.";
    }
    if (image.bitsPerComponent !== 8) {
        return `Unsupported bits-per-component: ${image.bitsPerComponent} (only 8 is implemented).`;
    }
    if (image.pixelColorModel === "unknown") {
        return `Unsupported color space: ${image.colorSpace || "(none)"}.`;
    }

    return "Pixel data could not be encoded.";
}

function expandToRgba(pixels: Uint8Array, width: number, height: number, pixelColorModel: WasmPixelColorModel): Uint8ClampedArray | null {
    const total = width * height;
    const rgba = new Uint8ClampedArray(total * 4);

    switch (pixelColorModel) {
        case "gray":
            for (let i = 0; i < total; i++) {
                const value = pixels[i] ?? 0;
                const offset = i * 4;
                rgba[offset] = value;
                rgba[offset + 1] = value;
                rgba[offset + 2] = value;
                rgba[offset + 3] = 255;
            }

            return rgba;

        case "rgb":
            // srgb passthrough; embedded icc profile calibration is ignored
            for (let i = 0; i < total; i++) {
                const source = i * 3;
                const offset = i * 4;
                rgba[offset] = pixels[source] ?? 0;
                rgba[offset + 1] = pixels[source + 1] ?? 0;
                rgba[offset + 2] = pixels[source + 2] ?? 0;
                rgba[offset + 3] = 255;
            }

            return rgba;

        case "cmyk":
            // naive cmyk to rgb without color management; preview-quality only
            for (let i = 0; i < total; i++) {
                const source = i * 4;
                const c = (pixels[source] ?? 0) / 255;
                const m = (pixels[source + 1] ?? 0) / 255;
                const y = (pixels[source + 2] ?? 0) / 255;
                const k = (pixels[source + 3] ?? 0) / 255;
                const offset = i * 4;
                rgba[offset] = Math.round((1 - c) * (1 - k) * 255);
                rgba[offset + 1] = Math.round((1 - m) * (1 - k) * 255);
                rgba[offset + 2] = Math.round((1 - y) * (1 - k) * 255);
                rgba[offset + 3] = 255;
            }

            return rgba;

        case "unknown":
            return null;

        default:
            return assertNever(pixelColorModel);
    }
}

function pixelColorModelComponents(pixelColorModel: WasmPixelColorModel): 1 | 3 | 4 | null {
    switch (pixelColorModel) {
        case "gray":
            return 1;

        case "rgb":
            return 3;

        case "cmyk":
            return 4;

        case "unknown":
            return null;

        default:
            return assertNever(pixelColorModel);
    }
}

function assertNever(value: never): never {
    throw new Error(`Unhandled pixel color model: ${value}`);
}

function createCanvas(width: number, height: number): OffscreenCanvas | HTMLCanvasElement | null {
    if (typeof OffscreenCanvas !== "undefined") {
        return new OffscreenCanvas(width, height);
    }
    if (typeof document !== "undefined") {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        return canvas;
    }

    return null;
}

function createImageData(rgba: Uint8ClampedArray, width: number, height: number): ImageData | null {
    if (typeof ImageData === "undefined") return null;

    // rgba is locally allocated, so its buffer is always ArrayBuffer (not Shared)
    return new ImageData(rgba as Uint8ClampedArray<ArrayBuffer>, width, height);
}
