import { describe, expect, it } from "vitest";
import type { ExtractedImage } from "@pdfly/wasm";
import type { PdfPageJpg } from "@pdfly/wasm/render";
import {
    buildBrowserReadyImageEntries,
    buildExtractedImageEntries,
    buildJpgPageEntries,
    buildSplitPageEntries,
    ensureFileExtension,
    ensurePdfExtension,
    filterPdfFiles,
    findFirstPdfFile,
    imageDownloadName,
    isPdfFile,
    makeArchiveName,
    makePageJpgName,
    makePagePdfName,
} from "./pdfToolUtils";

function makeFile(name: string, type = "application/octet-stream") {
    return new File(["content"], name, { type });
}

describe("pdfToolUtils", () => {
    it("detects PDFs by MIME type or extension", () => {
        expect(isPdfFile(makeFile("document.bin", "application/pdf"))).toBe(true);
        expect(isPdfFile(makeFile("document.PDF"))).toBe(true);
        expect(isPdfFile(makeFile("document.txt", "text/plain"))).toBe(false);
    });

    it("filters and selects PDF files from mixed input", () => {
        const files = [makeFile("notes.txt", "text/plain"), makeFile("first.pdf"), makeFile("second.pdf", "application/pdf")];

        expect(findFirstPdfFile(files)?.name).toBe("first.pdf");
        expect(filterPdfFiles(files).map((file) => file.name)).toEqual(["first.pdf", "second.pdf"]);
    });

    it("normalizes output PDF names", () => {
        expect(ensurePdfExtension("merged")).toBe("merged.pdf");
        expect(ensurePdfExtension("merged.PDF")).toBe("merged.PDF");
        expect(ensurePdfExtension("   ")).toBe("document.pdf");
        expect(ensureFileExtension("images", "zip")).toBe("images.zip");
        expect(makeArchiveName("{basename}_pages", "source")).toBe("source_pages.zip");
    });

    it("builds split page names and entries", () => {
        const firstPage = new Uint8Array([1]);
        const secondPage = new Uint8Array([2]);

        expect(makePagePdfName("{basename}_page_{page}", "source", 1)).toBe("source_page_2.pdf");
        expect(makePagePdfName("{basename}_{page}.pdf", "source", 0)).toBe("source_1.pdf");
        expect(buildSplitPageEntries([firstPage, secondPage], "{basename}_page_{page}", "source")).toEqual({
            "source_page_1.pdf": firstPage,
            "source_page_2.pdf": secondPage,
        });
    });

    it("builds JPG page names and entries", async () => {
        const firstPageBytes = new Uint8Array([1, 2, 3]);
        const secondPageBytes = new Uint8Array([4, 5, 6]);
        const pages: PdfPageJpg[] = [
            { pageIndex: 0, blob: new Blob([firstPageBytes as BlobPart], { type: "image/jpeg" }), width: 800, height: 1000 },
            { pageIndex: 1, blob: new Blob([secondPageBytes as BlobPart], { type: "image/jpeg" }), width: 800, height: 1000 },
        ];

        expect(makePageJpgName("{basename}_page_{page}", "source", 1)).toBe("source_page_002.jpg");
        expect(makePageJpgName("{basename}_{page}.jpeg", "source", 0)).toBe("source_001.jpg");
        expect(await buildJpgPageEntries(pages, "{basename}_page_{page}", "source")).toEqual({
            "source_page_001.jpg": firstPageBytes,
            "source_page_002.jpg": secondPageBytes,
        });
    });

    it("names extracted images from their browser-ready or raw formats", () => {
        expect(imageDownloadName("source", 0, { mimeType: "image/jpeg" } as ExtractedImage)).toBe("source_image_001.jpg");
        expect(imageDownloadName("source", 1, { mimeType: "image/png" } as ExtractedImage)).toBe("source_image_002.png");
        expect(imageDownloadName("source", 2, { filter: "CCITTFaxDecode" } as ExtractedImage)).toBe("source_image_003.ccitt.bin");
    });

    it("builds ZIP entries only for browser-ready extracted images", async () => {
        const imageBytes = new Uint8Array([1, 2, 3]);
        const rawBytes = new Uint8Array([4, 5, 6]);
        const entries = await buildBrowserReadyImageEntries(
            [
                { blob: new Blob([imageBytes as BlobPart], { type: "image/png" }), mimeType: "image/png" } as ExtractedImage,
                { blob: null, bytes: rawBytes, filter: "CCITTFaxDecode" } as ExtractedImage,
            ],
            "source",
        );

        expect(Object.keys(entries)).toEqual(["source_image_001.png"]);
        expect(entries["source_image_001.png"]).toEqual(imageBytes);
    });

    it("can include raw extracted image streams in ZIP entries", async () => {
        const imageBytes = new Uint8Array([1, 2, 3]);
        const rawBytes = new Uint8Array([4, 5, 6]);
        const entries = await buildExtractedImageEntries(
            [
                { blob: new Blob([imageBytes as BlobPart], { type: "image/png" }), mimeType: "image/png" } as ExtractedImage,
                { blob: null, bytes: rawBytes, filter: "CCITTFaxDecode" } as ExtractedImage,
            ],
            "source",
            { includeRawStreams: true },
        );

        expect(Object.keys(entries)).toEqual(["source_image_001.png", "source_image_002.ccitt.bin"]);
        expect(entries["source_image_001.png"]).toEqual(imageBytes);
        expect(entries["source_image_002.ccitt.bin"]).toEqual(rawBytes);
    });
});
