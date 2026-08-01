import { getQpdfBinding } from "../bindings/index.js";
import { QpdfWatermarkError } from "../errors/index.js";
import { toUint8Array } from "../utils/buffer.js";
import type { WatermarkOptions, WatermarkPlacement, WatermarkResult } from "../types/index.js";

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
