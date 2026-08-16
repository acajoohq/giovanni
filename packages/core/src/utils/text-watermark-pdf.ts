const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;

// Helvetica-Bold average glyph advance width in em units
const HELV_BOLD_AVG_WIDTH = 0.52;

type PdfObject = {
    dictionary: string;
    stream?: Uint8Array;
};

function encodeAscii(text: string): Uint8Array {
    return new TextEncoder().encode(text);
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
    const total = parts.reduce((sum, p) => sum + p.length, 0);
    const result = new Uint8Array(total);
    let offset = 0;
    for (const p of parts) {
        result.set(p, offset);
        offset += p.length;
    }
    return result;
}

function buildPdf(objects: PdfObject[]): Uint8Array {
    const header = "%PDF-1.4\n%----\n";
    const objectBytes: Uint8Array[] = [];
    const objectOffsets: number[] = [];
    let currentOffset = encodeAscii(header).length;

    for (let i = 0; i < objects.length; i++) {
        const objNum = i + 1;
        const obj = objects[i];
        objectOffsets.push(currentOffset);

        const parts: Uint8Array[] = [encodeAscii(`${objNum} 0 obj\n${obj.dictionary}`)];
        if (obj.stream) {
            parts.push(encodeAscii("\nstream\n"));
            parts.push(obj.stream);
            parts.push(encodeAscii("\nendstream"));
        }
        parts.push(encodeAscii("\nendobj\n"));

        const bytes = concatBytes(parts);
        objectBytes.push(bytes);
        currentOffset += bytes.length;
    }

    const xrefOffset = currentOffset;
    const xrefLines = [
        `xref\n0 ${objects.length + 1}\n`,
        "0000000000 65535 f \n",
        ...objectOffsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`),
        "trailer\n",
        `<< /Size ${objects.length + 1} /Root 1 0 R >>\n`,
        "startxref\n",
        `${xrefOffset}\n`,
        "%%EOF\n",
    ];

    return concatBytes([encodeAscii(header), ...objectBytes, encodeAscii(xrefLines.join(""))]);
}

function sanitizeText(text: string): string {
    const normalized = text.trim().replace(/\s+/g, " ");
    const ascii = normalized.normalize("NFKD").replace(/[^\x20-\x7E]/g, "");
    const safe = ascii.length > 0 ? ascii : "CONFIDENTIAL";
    return safe.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildSingleContentStream(safeText: string, fontSize: number, angleDeg: number): Uint8Array {
    const rad = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(rad).toFixed(4);
    const sin = Math.sin(rad).toFixed(4);
    const negSin = (-Math.sin(rad)).toFixed(4);
    const cx = (PAGE_WIDTH / 2).toFixed(1);
    const cy = (PAGE_HEIGHT / 2).toFixed(1);
    const halfWidth = (-(safeText.length * fontSize * HELV_BOLD_AVG_WIDTH * 0.5)).toFixed(1);
    const baseline = (-(fontSize * 0.25)).toFixed(1);

    const lines = ["q", "/GS1 gs", `${cos} ${sin} ${negSin} ${cos} ${cx} ${cy} cm`, "BT", `/F1 ${fontSize} Tf`, `${halfWidth} ${baseline} Td`, `(${safeText}) Tj`, "ET", "Q", ""];
    return encodeAscii(lines.join("\n"));
}

function buildTileContentStream(safeText: string, fontSize: number, angleDeg: number): Uint8Array {
    const rad = (angleDeg * Math.PI) / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);

    const textWidth = safeText.length * fontSize * HELV_BOLD_AVG_WIDTH;
    const colStep = textWidth * 1.3;
    const rowStep = fontSize * 2.4;
    const stagger = colStep * 0.5;

    // Compute the page corners in the rotated coordinate system (inverse CTM: rotate by -θ).
    // A point (px, py) in page space → user space: (px*cosA + py*sinA, -px*sinA + py*cosA)
    const xs = [0, PAGE_WIDTH * cosA, PAGE_HEIGHT * sinA, PAGE_WIDTH * cosA + PAGE_HEIGHT * sinA];
    const ys = [0, -PAGE_WIDTH * sinA, PAGE_HEIGHT * cosA, -PAGE_WIDTH * sinA + PAGE_HEIGHT * cosA];

    const xMin = Math.min(...xs) - colStep;
    const xMax = Math.max(...xs) + colStep;
    const yMin = Math.min(...ys) - rowStep;
    const yMax = Math.max(...ys) + rowStep;

    // Rotate the CTM once; each Tm is then an identity-rotation placement in that space.
    const lines: string[] = ["q", "/GS1 gs", `${cosA.toFixed(4)} ${sinA.toFixed(4)} ${(-sinA).toFixed(4)} ${cosA.toFixed(4)} 0 0 cm`, "BT", `/F1 ${fontSize} Tf`];

    let row = 0;
    for (let y = yMin; y <= yMax; y += rowStep) {
        const xShift = row % 2 === 0 ? 0 : stagger;
        for (let x = xMin + xShift; x <= xMax; x += colStep) {
            lines.push(`1 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)} Tm`);
            lines.push(`(${safeText}) Tj`);
        }
        row++;
    }

    lines.push("ET", "Q", "");
    return encodeAscii(lines.join("\n"));
}

/**
 * Build a single-page watermark PDF from text styling options.
 * Uses PDF 1.4 ExtGState for real fill opacity.
 * "tile" pattern repeats the text in a staggered grid across the page.
 */
export function buildTextWatermarkPdf(text: string, fontSize: number, opacity: number, angleDeg: number, pattern: "single" | "tile"): Uint8Array {
    const safeText = sanitizeText(text);
    const contentBytes = pattern === "tile" ? buildTileContentStream(safeText, fontSize, angleDeg) : buildSingleContentStream(safeText, fontSize, angleDeg);

    const objects: PdfObject[] = [
        { dictionary: "<< /Type /Catalog /Pages 2 0 R >>" },
        { dictionary: "<< /Type /Pages /Kids [3 0 R] /Count 1 >>" },
        {
            dictionary: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 4 0 R >> /ExtGState << /GS1 5 0 R >> >> /Contents 6 0 R >>`,
        },
        { dictionary: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>" },
        { dictionary: `<< /Type /ExtGState /ca ${opacity.toFixed(3)} /CA ${opacity.toFixed(3)} >>` },
        { dictionary: `<< /Length ${contentBytes.length} >>`, stream: contentBytes },
    ];

    return buildPdf(objects);
}
