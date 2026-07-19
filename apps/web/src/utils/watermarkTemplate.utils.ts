const DEFAULT_WATERMARK_TEXT = "CONFIDENTIAL";

function sanitizePdfText(text: string): string {
    const normalized = text.trim().replace(/\s+/g, " ");
    const asciiOnly = normalized.normalize("NFKD").replace(/[^\x20-\x7E]/g, "");
    const safe = asciiOnly.length > 0 ? asciiOnly : DEFAULT_WATERMARK_TEXT;

    return safe.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildPdf(objects: string[]): Uint8Array {
    let output = "%PDF-1.4\n%----\n";
    const offsets: number[] = [0];

    for (let index = 0; index < objects.length; index += 1) {
        offsets.push(output.length);
        output += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
    }

    const xrefOffset = output.length;
    output += `xref\n0 ${objects.length + 1}\n`;
    output += "0000000000 65535 f \n";

    for (let index = 1; index <= objects.length; index += 1) {
        output += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
    }

    output += "trailer\n";
    output += `<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
    output += "startxref\n";
    output += `${xrefOffset}\n`;
    output += "%%EOF\n";

    return new TextEncoder().encode(output);
}

/**
 * Create a simple one-page watermark PDF that can be passed to giovanni-core watermarkPdf.
 */
export function createDefaultWatermarkPdf(text: string): Uint8Array {
    const safeText = sanitizePdfText(text);
    const content = ["q", "0.7071 0.7071 -0.7071 0.7071 250 190 cm", "BT", "/F1 64 Tf", "0.85 g", `(${safeText}) Tj`, "ET", "Q", ""].join("\n");

    const contentLength = new TextEncoder().encode(content).length;

    const objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
        `<< /Length ${contentLength} >>\nstream\n${content}\nendstream`,
    ];

    return buildPdf(objects);
}

export { DEFAULT_WATERMARK_TEXT };
