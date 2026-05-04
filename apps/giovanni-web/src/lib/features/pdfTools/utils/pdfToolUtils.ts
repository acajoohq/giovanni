import { formatBytes, type ExtractedImage } from "@pdfly/wasm";
import { zip } from "fflate";

export function isPdfFile(file: File): boolean {
    return file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf");
}

export function findFirstPdfFile(files: File[]): File | null {
    return files.find(isPdfFile) ?? null;
}

export function filterPdfFiles(files: File[]): File[] {
    return files.filter(isPdfFile);
}

export function pdfBaseName(file: File | null): string {
    return file?.name.replace(/\.pdf$/i, "") || "document";
}

export function ensurePdfExtension(fileName: string): string {
    return ensureFileExtension(fileName, "pdf", "document");
}

export function ensureFileExtension(fileName: string, extension: string, fallbackBaseName = "document"): string {
    const trimmedName = fileName.trim();
    const baseName = trimmedName.length > 0 ? trimmedName : fallbackBaseName;
    const normalizedExtension = extension.replace(/^\./, "");

    return baseName.toLowerCase().endsWith(`.${normalizedExtension.toLowerCase()}`) ? baseName : `${baseName}.${normalizedExtension}`;
}

export function makeArchiveName(pattern: string, baseName: string, extension = "zip"): string {
    const resolvedName = pattern.replaceAll("{basename}", baseName);

    return ensureFileExtension(resolvedName, extension, `${baseName}_archive`);
}

export function makePagePdfName(pattern: string, baseName: string, pageIndex: number): string {
    return pattern
        .replaceAll("{basename}", baseName)
        .replaceAll("{page}", String(pageIndex + 1))
        .replace(/\.pdf$/i, "")
        .concat(".pdf");
}

export function buildSplitPageEntries(pages: Uint8Array[], pattern: string, baseName: string): Record<string, Uint8Array> {
    return Object.fromEntries(pages.map((page, index) => [makePagePdfName(pattern, baseName, index), page]));
}

export function formatDuration(ms: number): string {
    return `${(ms / 1000).toFixed(2)}s`;
}

export function formatThroughput(byteLength: number, elapsedMs: number): string {
    const seconds = elapsedMs / 1000;
    if (!Number.isFinite(seconds) || seconds <= 0) {
        return "-";
    }
    return `${formatBytes(byteLength / seconds)}/s`;
}

export function downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function downloadPdf(data: Uint8Array, fileName: string): void {
    downloadBlob(new Blob([data as BlobPart], { type: "application/pdf" }), fileName);
}

type ZipLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export async function downloadZip(entries: Record<string, Uint8Array>, fileName: string, level: ZipLevel = 6): Promise<void> {
    const zipped = await new Promise<Uint8Array>((resolve, reject) => {
        zip(entries, { level }, (error, data) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(data);
        });
    });

    downloadBlob(new Blob([zipped as BlobPart], { type: "application/zip" }), fileName);
}

interface BuildExtractedImageEntriesOptions {
    includeRawStreams?: boolean;
}

export async function buildExtractedImageEntries(images: ExtractedImage[], baseName: string, options: BuildExtractedImageEntriesOptions = {}): Promise<Record<string, Uint8Array>> {
    const entries: Record<string, Uint8Array> = {};

    for (const [index, image] of images.entries()) {
        const name = imageDownloadName(baseName, index, image);

        if (image.blob) {
            entries[name] = new Uint8Array(await image.blob.arrayBuffer());
            continue;
        }

        if (options.includeRawStreams) {
            entries[name] = image.bytes;
        }
    }

    return entries;
}

export async function buildBrowserReadyImageEntries(images: ExtractedImage[], baseName: string): Promise<Record<string, Uint8Array>> {
    return buildExtractedImageEntries(images, baseName);
}

export function imageDownloadName(baseName: string, index: number, image: ExtractedImage): string {
    const ordinal = String(index + 1).padStart(3, "0");
    return `${baseName}_image_${ordinal}.${imageExtension(image)}`;
}

function imageExtension(image: ExtractedImage): string {
    if (image.mimeType === "image/jpeg") {
        return "jpg";
    }
    if (image.mimeType === "image/jp2") {
        return "jp2";
    }
    if (image.mimeType === "image/png") {
        return "png";
    }
    if (image.filter === "CCITTFaxDecode") {
        return "ccitt.bin";
    }
    if (image.filter === "JBIG2Decode") {
        return "jbig2.bin";
    }
    return "bin";
}
