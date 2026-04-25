import { compressPdf, formatBytes, getVersion, splitPages } from "@pdfly/wasm";

const SPLIT_LIST_PAGE_SIZE = 10;

let compressedData: Uint8Array | null = null;
let splitPagesData: Uint8Array[] = [];
let splitFileName = "document";
let splitListPageIndex = 0;

getVersion()
    .then((version) => setText("version", `qpdf ${version}`))
    .catch(() => setText("version", "qpdf version unavailable"));

// tab switching
document.querySelectorAll<HTMLButtonElement>(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".tab-button").forEach((b) => b.classList.remove("active"));
        document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
        button.classList.add("active");
        document.getElementById(`tab-${button.dataset.tab}`)?.classList.add("active");
    });
});

// compress tab
const compressUpload = document.getElementById("compress-upload") as HTMLButtonElement;
const compressInput = document.getElementById("compress-input") as HTMLInputElement;
const levelSlider = document.getElementById("compression-level") as HTMLInputElement;

compressUpload.addEventListener("click", () => compressInput.click());
compressUpload.addEventListener("dragover", (event) => {
    event.preventDefault();
    compressUpload.classList.add("drag-over");
});
compressUpload.addEventListener("dragleave", () => compressUpload.classList.remove("drag-over"));
compressUpload.addEventListener("drop", (event) => {
    event.preventDefault();
    compressUpload.classList.remove("drag-over");
    const file = event.dataTransfer?.files.item(0);
    if (file) void handleCompressFile(file);
});
compressInput.addEventListener("change", (event) => {
    const file = (event.target as HTMLInputElement).files?.item(0);
    if (file) void handleCompressFile(file);
});
levelSlider.addEventListener("input", () => setText("level-value", levelSlider.value));

document.getElementById("download-btn")?.addEventListener("click", () => {
    if (compressedData) downloadData(compressedData, "compressed.pdf");
});

async function handleCompressFile(file: File): Promise<void> {
    if (!isPdfFile(file)) {
        showStatus("compress-status", "Please select a PDF file", "error");
        return;
    }

    showStatus("compress-status", "Reading file...", "info");

    try {
        const arrayBuffer = await file.arrayBuffer();
        const options = {
            compressionLevel: parseInt(levelSlider.value),
            decodeLevel: (document.getElementById("decode-level") as HTMLSelectElement).value as "none" | "generalized" | "specialized" | "all",
            recompressFlate: (document.getElementById("recompress-flate") as HTMLInputElement).checked,
            compressPages: (document.getElementById("compress-pages") as HTMLInputElement).checked,
            removeUnreferencedResources: (document.getElementById("remove-unreferenced") as HTMLInputElement).checked,
        };

        showStatus("compress-status", "Compressing PDF...", "info");

        const startTime = performance.now();
        const result = await compressPdf(arrayBuffer, options);
        const elapsedSeconds = (performance.now() - startTime) / 1000;
        const processingTime = elapsedSeconds.toFixed(2);
        const savingsPercent = ((result.savedBytes / result.originalSize) * 100).toFixed(1);

        compressedData = result.data;
        setText("savings", `${savingsPercent}% saved`);
        setText("original-size", formatBytes(result.originalSize));
        setText("compressed-size", formatBytes(result.compressedSize));
        setText("saved-size", formatBytes(result.savedBytes));
        setText("processing-time", `${processingTime}s`);
        setText("compress-throughput", formatThroughputBytesPerSecond(result.originalSize, elapsedSeconds));
        document.getElementById("compress-results")?.classList.add("show");
        showStatus("compress-status", "Compression complete!", "success");
    } catch (error) {
        showStatus("compress-status", `Error: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
    }
}

// split tab
const splitUpload = document.getElementById("split-upload") as HTMLButtonElement;
const splitInput = document.getElementById("split-input") as HTMLInputElement;

splitUpload.addEventListener("click", () => splitInput.click());
splitUpload.addEventListener("dragover", (event) => {
    event.preventDefault();
    splitUpload.classList.add("drag-over");
});
splitUpload.addEventListener("dragleave", () => splitUpload.classList.remove("drag-over"));
splitUpload.addEventListener("drop", (event) => {
    event.preventDefault();
    splitUpload.classList.remove("drag-over");
    const file = event.dataTransfer?.files.item(0);
    if (file) void handleSplitFile(file);
});
splitInput.addEventListener("change", (event) => {
    const file = (event.target as HTMLInputElement).files?.item(0);
    if (file) void handleSplitFile(file);
});

document.getElementById("download-all-btn")?.addEventListener("click", () => {
    splitPagesData.forEach((page, i) => {
        setTimeout(() => downloadData(page, `${splitFileName}_page_${i + 1}.pdf`), i * 150);
    });
});

document.getElementById("split-page-prev")?.addEventListener("click", () => {
    if (splitListPageIndex <= 0) return;

    splitListPageIndex -= 1;
    renderPagesList(splitPagesData, splitFileName);
});

document.getElementById("split-page-next")?.addEventListener("click", () => {
    const pageCount = Math.ceil(splitPagesData.length / SPLIT_LIST_PAGE_SIZE);
    if (splitListPageIndex >= pageCount - 1) return;

    splitListPageIndex += 1;
    renderPagesList(splitPagesData, splitFileName);
});

async function handleSplitFile(file: File): Promise<void> {
    if (!isPdfFile(file)) {
        showStatus("split-status", "Please select a PDF file", "error");
        return;
    }

    splitFileName = file.name.replace(/\.pdf$/i, "") || "document";
    splitListPageIndex = 0;
    showStatus("split-status", "Splitting PDF...", "info");

    try {
        const arrayBuffer = await file.arrayBuffer();
        const startTime = performance.now();
        const result = await splitPages(arrayBuffer);
        const elapsedSeconds = (performance.now() - startTime) / 1000;

        const label = result.pageCount === 1 ? "page" : "pages";

        splitPagesData = result.pages;
        setText("split-title", `${result.pageCount} ${label} extracted`);
        setText("split-processing-time", `${elapsedSeconds.toFixed(2)}s`);
        setText("split-pages-per-sec", formatPagesPerSecond(result.pageCount, elapsedSeconds));
        setText("split-throughput", formatThroughputBytesPerSecond(arrayBuffer.byteLength, elapsedSeconds));
        renderPagesList(result.pages, splitFileName);
        document.getElementById("split-results")?.classList.add("show");
        showStatus("split-status", `Successfully split into ${result.pageCount} ${label}`, "success");
    } catch (error) {
        showStatus("split-status", `Error: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
    }
}

function renderPagesList(pages: Uint8Array[], baseName: string): void {
    const list = document.getElementById("pages-list");
    if (!list) return;

    const total = pages.length;
    if (total === 0) {
        list.innerHTML = "";
        updateSplitPagination(0);
        return;
    }

    const listPageCount = Math.ceil(total / SPLIT_LIST_PAGE_SIZE);
    if (splitListPageIndex >= listPageCount) {
        splitListPageIndex = Math.max(0, listPageCount - 1);
    }

    const sliceStart = splitListPageIndex * SPLIT_LIST_PAGE_SIZE;
    const sliceEnd = Math.min(sliceStart + SPLIT_LIST_PAGE_SIZE, total);

    list.innerHTML = "";
    for (let index = sliceStart; index < sliceEnd; index++) {
        const page = pages[index];
        if (!page) continue;

        const fileName = `${baseName}_page_${index + 1}.pdf`;

        const label = document.createElement("div");
        label.className = "page-item-label";

        const icon = document.createElement("span");
        icon.className = "page-icon";
        icon.textContent = "PDF";

        const meta = document.createElement("div");
        const name = document.createElement("div");
        name.className = "page-name";
        name.textContent = fileName;
        const size = document.createElement("div");
        size.className = "page-size";
        size.textContent = formatBytes(page.byteLength);
        meta.appendChild(name);
        meta.appendChild(size);

        label.appendChild(icon);
        label.appendChild(meta);

        const button = document.createElement("button");
        button.className = "button secondary small";
        button.type = "button";
        button.textContent = "Download";
        button.addEventListener("click", () => downloadData(page, fileName));

        const item = document.createElement("div");
        item.className = "page-item";
        item.appendChild(label);
        item.appendChild(button);
        list.appendChild(item);
    }

    updateSplitPagination(total);
}

function updateSplitPagination(totalItemCount: number): void {
    const pagination = document.getElementById("split-pagination");
    const info = document.getElementById("split-page-info");
    const previousButton = document.getElementById("split-page-prev") as HTMLButtonElement | null;
    const nextButton = document.getElementById("split-page-next") as HTMLButtonElement | null;
    if (!pagination || !info || !previousButton || !nextButton) return;

    if (totalItemCount <= SPLIT_LIST_PAGE_SIZE) {
        pagination.hidden = true;
        return;
    }

    pagination.hidden = false;
    const listPageCount = Math.ceil(totalItemCount / SPLIT_LIST_PAGE_SIZE);
    const rangeStart = splitListPageIndex * SPLIT_LIST_PAGE_SIZE + 1;
    const rangeEnd = Math.min((splitListPageIndex + 1) * SPLIT_LIST_PAGE_SIZE, totalItemCount);
    info.textContent = `Showing ${rangeStart}–${rangeEnd} of ${totalItemCount} · list ${splitListPageIndex + 1} / ${listPageCount}`;

    previousButton.disabled = splitListPageIndex <= 0;
    nextButton.disabled = splitListPageIndex >= listPageCount - 1;
}

function formatThroughputBytesPerSecond(byteLength: number, elapsedSeconds: number): string {
    if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0 || !Number.isFinite(byteLength) || byteLength < 0) {
        return "—";
    }

    return `${formatBytes(byteLength / elapsedSeconds)}/s`;
}

function formatPagesPerSecond(pageCount: number, elapsedSeconds: number): string {
    if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0 || !Number.isFinite(pageCount) || pageCount < 0) {
        return "—";
    }

    return `${(pageCount / elapsedSeconds).toFixed(1)} p/s`;
}

function isPdfFile(file: File): boolean {
    return file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf");
}

function downloadData(data: Uint8Array, fileName: string): void {
    const url = URL.createObjectURL(new Blob([data as BlobPart], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
}

function setText(id: string, text: string): void {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
}

function showStatus(id: string, message: string, type: "info" | "success" | "error"): void {
    const element = document.getElementById(id);
    if (!element) return;
    element.textContent = message;
    element.className = `status ${type}`;
}
