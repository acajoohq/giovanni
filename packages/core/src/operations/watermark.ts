import { getQpdfBinding } from "../bindings/index.js";
import { QpdfWatermarkError } from "../errors/index.js";
import { buildTextWatermarkPdf } from "../utils/text-watermark-pdf.js";
import { toUint8Array } from "../utils/buffer.js";
import type { WatermarkOptions, WatermarkPlacement, WatermarkResult, WatermarkTextOptions } from "../types/index.js";

/**
 * Apply a watermark PDF page onto selected pages of an input PDF.
 *
 * @param input - Source PDF bytes
 * @param options - Watermark configuration and watermark PDF bytes
 * @returns WatermarkResult containing output bytes and summary metadata
 */
export async function watermarkPdf(input: Uint8Array | ArrayBuffer, options: WatermarkOptions): Promise<WatermarkResult> {
    try {
        const inputBuffer = toUint8Array(input);
        const watermarkBuffer = toUint8Array(options.watermark);
        const placement: WatermarkPlacement = options.placement ?? "overlay";
        const underlay = placement === "underlay";

        const inputInfo = await getQpdfBinding().getDocumentInfo(inputBuffer, options.password);
        if (inputInfo.numPages <= 0) {
            throw new QpdfWatermarkError("Input PDF has no pages to watermark");
        }

        const watermarkInfo = await getQpdfBinding().getDocumentInfo(watermarkBuffer, options.watermarkPassword);
        if (watermarkInfo.numPages <= 0) {
            throw new QpdfWatermarkError("Watermark PDF must contain at least one page");
        }

        const pages = validateTargetPages(options.pages, inputInfo.numPages);

        const data = await getQpdfBinding().watermarkPdf(
            inputBuffer,
            watermarkBuffer,
            {
                underlay,
                pages,
            },
            options.password,
            options.watermarkPassword,
        );

        return {
            data,
            pageCount: inputInfo.numPages,
            watermarkedPageCount: pages.length === 0 ? inputInfo.numPages : pages.length,
            placement,
        };
    } catch (error) {
        if (error instanceof TypeError) {
            throw new QpdfWatermarkError(error.message, { cause: error, code: "invalid_input" });
        }
        if (error instanceof QpdfWatermarkError) {
            throw error;
        }
        throw new QpdfWatermarkError("Failed to apply PDF watermark", { cause: error });
    }
}

function validateTargetPages(pages: number[] | undefined, pageCount: number): number[] {
    if (pages === undefined) {
        return [];
    }

    if (pages.length === 0) {
        throw new QpdfWatermarkError("pages must contain at least one page index when provided");
    }

    const seen = new Set<number>();
    for (const page of pages) {
        if (!Number.isInteger(page) || page < 0 || page >= pageCount) {
            throw new QpdfWatermarkError(`Invalid page index ${page}: must be an integer between 0 and ${pageCount - 1}`);
        }
        if (seen.has(page)) {
            throw new QpdfWatermarkError(`Duplicate page index ${page} is not allowed`);
        }
        seen.add(page);
    }

    return pages;
}

const DEFAULT_TEXT = "CONFIDENTIAL";
const DEFAULT_FONT_SIZE = 64;
const DEFAULT_OPACITY = 0.15;
const DEFAULT_ANGLE = 45;

/**
 * Apply a text watermark to a PDF without needing a pre-built watermark PDF.
 * The watermark PDF is generated internally from the provided text styling options.
 *
 * @param input - Source PDF bytes
 * @param options - Text watermark styling and placement options
 * @returns WatermarkResult containing output bytes and summary metadata
 */
export async function watermarkTextPdf(input: Uint8Array | ArrayBuffer, options: WatermarkTextOptions): Promise<WatermarkResult> {
    try {
        const fontSize = Math.max(8, Math.min(200, options.fontSize ?? DEFAULT_FONT_SIZE));
        const opacity = Math.max(0, Math.min(1, options.opacity ?? DEFAULT_OPACITY));
        const angle = options.angle ?? DEFAULT_ANGLE;
        const text = options.text?.trim().length > 0 ? options.text : DEFAULT_TEXT;
        const pattern = options.pattern ?? "tile";

        const watermarkBuffer = buildTextWatermarkPdf(text, fontSize, opacity, angle, pattern);

        return watermarkPdf(input, {
            watermark: watermarkBuffer,
            placement: options.placement ?? "overlay",
            pages: options.pages,
            password: options.password,
        });
    } catch (error) {
        if (error instanceof QpdfWatermarkError) {
            throw error;
        }
        throw new QpdfWatermarkError("Failed to apply text watermark", { cause: error });
    }
}
