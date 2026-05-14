import { afterEach, describe, expect, it, vi } from "vitest";
import { encodeRawPixelsAsPng, rawPixelUnsupportedReason } from "./pixel-encoder.js";
import type { WasmExtractedImage } from "../types/wasm-module.js";

describe("raw pixel encoder", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("uses pixelColorModel rather than components to decide support", async () => {
        const image = createImage({ components: 3, pixelColorModel: "unknown" });

        await expect(encodeRawPixelsAsPng(image)).resolves.toBeNull();
    });

    it("reports unsupported color spaces for unknown pixel color models", () => {
        vi.stubGlobal("OffscreenCanvas", class MockOffscreenCanvas {});
        const image = createImage({ colorSpace: "/Lab", components: 3, pixelColorModel: "unknown" });

        expect(rawPixelUnsupportedReason(image)).toBe("Unsupported color space: /Lab.");
    });
});

function createImage(overrides: Partial<WasmExtractedImage> = {}): WasmExtractedImage {
    return {
        objectKey: "1/0",
        xobjectKey: "Im0",
        pageIndex: 0,
        filter: "FlateDecode",
        width: 1,
        height: 1,
        bitsPerComponent: 8,
        colorSpace: "/DeviceRGB",
        components: 3,
        pixelColorModel: "rgb",
        hasMask: false,
        hasSMask: false,
        isImageMask: false,
        strategy: "raw-pixels",
        bytes: new Uint8Array([255, 0, 0]),
        ...overrides,
    };
}
