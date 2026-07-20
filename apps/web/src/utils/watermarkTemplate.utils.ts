const DEFAULT_WATERMARK_TEXT = "CONFIDENTIAL";

type PdfObject = {
    dictionary: string;
    stream?: Uint8Array;
};

function sanitizePdfText(text: string): string {
    const normalized = text.trim().replace(/\s+/g, " ");
    const asciiOnly = normalized.normalize("NFKD").replace(/[^\x20-\x7E]/g, "");
    const safe = asciiOnly.length > 0 ? asciiOnly : DEFAULT_WATERMARK_TEXT;

    return safe.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
    const total = parts.reduce((sum, part) => sum + part.length, 0);
    const result = new Uint8Array(total);
    let offset = 0;

    for (const part of parts) {
        result.set(part, offset);
        offset += part.length;
    }

    return result;
}

function encodeAscii(text: string): Uint8Array {
    return new TextEncoder().encode(text);
}

function buildPdf(objects: PdfObject[]): Uint8Array {
    const objectBytes: Uint8Array[] = [];
    const objectOffsets: number[] = [0];

    let currentOffset = encodeAscii("%PDF-1.4\n%----\n").length;

    for (let index = 0; index < objects.length; index += 1) {
        const objectNumber = index + 1;
        const object = objects[index];

        objectOffsets.push(currentOffset);

        const parts: Uint8Array[] = [encodeAscii(`${objectNumber} 0 obj\n${object.dictionary}`)];
        if (object.stream) {
            parts.push(encodeAscii("\nstream\n"));
            parts.push(object.stream);
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
        ...objectOffsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`),
        "trailer\n",
        `<< /Size ${objects.length + 1} /Root 1 0 R >>\n`,
        "startxref\n",
        `${xrefOffset}\n`,
        "%%EOF\n",
    ];

    return concatBytes([encodeAscii("%PDF-1.4\n%----\n"), ...objectBytes, encodeAscii(xrefLines.join(""))]);
}

function encodeJpegToPdf(jpegBytes: Uint8Array, width: number, height: number): Uint8Array {
    const content = [`q`, `${width} 0 0 ${height} 0 0 cm`, `/Im0 Do`, `Q`, ``].join("\n");
    const contentBytes = encodeAscii(content);

    const objects: PdfObject[] = [
        { dictionary: "<< /Type /Catalog /Pages 2 0 R >>" },
        { dictionary: "<< /Type /Pages /Kids [3 0 R] /Count 1 >>" },
        { dictionary: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>` },
        {
            dictionary: `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>`,
            stream: jpegBytes,
        },
        { dictionary: `<< /Length ${contentBytes.length} >>`, stream: contentBytes },
    ];

    return buildPdf(objects);
}

function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const image = new Image();

        image.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(image);
        };

        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Unable to read watermark image."));
        };

        image.src = objectUrl;
    });
}

async function convertPngToJpeg(file: File): Promise<{ data: Uint8Array; width: number; height: number }> {
    const image = await loadImage(file);
    const width = Math.max(1, Math.floor(image.naturalWidth));
    const height = Math.max(1, Math.floor(image.naturalHeight));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
        throw new Error("Canvas is not available for image conversion.");
    }

    // Fill background to avoid transparent PNG regions becoming black in JPEG.
    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", 0.92);
    });

    if (!blob) {
        throw new Error("Failed to convert PNG watermark to JPEG.");
    }

    return {
        data: new Uint8Array(await blob.arrayBuffer()),
        width,
        height,
    };
}

async function readJpegMetadata(file: File): Promise<{ data: Uint8Array; width: number; height: number }> {
    const image = await loadImage(file);
    const width = Math.max(1, Math.floor(image.naturalWidth));
    const height = Math.max(1, Math.floor(image.naturalHeight));
    const data = new Uint8Array(await file.arrayBuffer());

    return { data, width, height };
}

/**
 * Create a simple one-page watermark PDF that can be passed to giovanni-core watermarkPdf.
 */
export function createDefaultWatermarkPdf(text: string): Uint8Array {
    const safeText = sanitizePdfText(text);
    const content = ["q", "0.7071 0.7071 -0.7071 0.7071 250 190 cm", "BT", "/F1 64 Tf", "0.85 g", `(${safeText}) Tj`, "ET", "Q", ""].join("\n");

    const contentBytes = encodeAscii(content);

    const objects: PdfObject[] = [
        { dictionary: "<< /Type /Catalog /Pages 2 0 R >>" },
        { dictionary: "<< /Type /Pages /Kids [3 0 R] /Count 1 >>" },
        { dictionary: "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>" },
        { dictionary: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>" },
        { dictionary: `<< /Length ${contentBytes.length} >>`, stream: contentBytes },
    ];

    return buildPdf(objects);
}

export function isJpegWatermarkFile(file: File): boolean {
    const lowerName = file.name.toLowerCase();
    return file.type === "image/jpeg" || lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg");
}

export function isPngWatermarkFile(file: File): boolean {
    const lowerName = file.name.toLowerCase();
    return file.type === "image/png" || lowerName.endsWith(".png");
}

export function isImageWatermarkFile(file: File): boolean {
    return isJpegWatermarkFile(file) || isPngWatermarkFile(file);
}

export async function createImageWatermarkPdf(file: File): Promise<Uint8Array> {
    const encoded = isJpegWatermarkFile(file) ? await readJpegMetadata(file) : await convertPngToJpeg(file);
    return encodeJpegToPdf(encoded.data, encoded.width, encoded.height);
}

export { DEFAULT_WATERMARK_TEXT };
