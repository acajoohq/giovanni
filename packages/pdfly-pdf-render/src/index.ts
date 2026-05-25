/**
 * @pdfly/pdf-render - PDF.js-based page rasterisation to JPEG.
 */

// pdf operations
export { renderPdfPagesToJpg } from "./operations/render-pages-to-jpg.js";

// error classes
export { PdfRenderError } from "./errors/index.js";

// types
export type { PdfPageJpg, RenderPdfPagesToJpgOptions, RenderPdfPagesToJpgResult } from "./types/index.js";
