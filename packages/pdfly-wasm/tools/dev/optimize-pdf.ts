/**
 * Inspect a PDF and optimize it with an automatically chosen preset.
 *
 * Usage:
 *   node --experimental-strip-types tools/dev/optimize-pdf.ts <input.pdf> <output.pdf>
 */

import { readFile, writeFile } from "node:fs/promises";
import { QpdfDocument } from "../../src/index.js";

const [, , inputPath, outputPath] = process.argv;

if (!inputPath || !outputPath) {
    console.error("Usage: optimize-pdf <input.pdf> <output.pdf>");
    process.exit(1);
}

const pdfBytes = await readFile(inputPath);
const document = await QpdfDocument.open(pdfBytes);

const { numPages, pdfVersion, isLinearized } = document.info();
console.log(`Pages: ${numPages}  |  PDF ${pdfVersion}  |  Linearized: ${isLinearized}`);

const preset = numPages > 50 ? "archive" : "web";
console.log(`Preset: ${preset}`);

const optimizedPdfBytes = await document.write({ preset });
document.dispose();

await writeFile(outputPath, optimizedPdfBytes);

const savedBytes = pdfBytes.byteLength - optimizedPdfBytes.byteLength;
const savedPercent = ((savedBytes / pdfBytes.byteLength) * 100).toFixed(1);
console.log(`Saved ${outputPath}  (${savedBytes > 0 ? `-${savedPercent}%` : "no reduction"})`);
