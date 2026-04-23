import { initQpdfModule } from './module-loader.js';
import { QpdfCompressionError } from './errors.js';
import { normalizeBuffer } from '../utils/validation.js';
import type { SplitResult } from '../types/index.js';

/**
 * Split a PDF into individual single-page PDFs
 *
 * @param input - PDF file as Uint8Array or ArrayBuffer
 * @returns SplitResult with an array of Uint8Arrays, one per page
 *
 * @example
 * const pdfBytes = await fetch('document.pdf').then(r => r.arrayBuffer());
 * const result = await splitPages(pdfBytes);
 * console.log(``Split into ${result.pageCount} pages``);
 * result.pages.forEach((page, i) => {
 *   const blob = new Blob([page], { type: 'application/pdf' });
 *   // save or process each page
 * });
 */
export async function splitPages(
  input: Uint8Array | ArrayBuffer
): Promise<SplitResult> {
  try {
    const module = await initQpdfModule();
    const inputBuffer = normalizeBuffer(input);
    const pages: Uint8Array[] = module.splitPages(inputBuffer);

    return {
      pages,
      pageCount: pages.length,
    };
  } catch (error) {
    if (error instanceof QpdfCompressionError) {
      throw error;
    }
    throw new QpdfCompressionError('Failed to split PDF', { cause: error });
  }
}