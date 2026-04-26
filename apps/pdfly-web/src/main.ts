import { zip } from "fflate";
import { compressPdf, formatBytes, getVersion, mergePdfs, splitPages } from "@pdfly/wasm";

const SPLIT_LIST_PAGE_SIZE = 10;

const COMPRESS_LOADER = { labelId: "compress-loader-label", loaderId: "compress-loader" } as const;
const SPLIT_LOADER = { labelId: "split-loader-label", loaderId: "split-loader" } as const;

let compressedData: Uint8Array | null = null;
let splitPagesData: Uint8Array[] = [];
let splitFileName = "document";
let splitListPageIndex = 0;

let mergeFiles: File[] = [];
let mergedData: Uint8Array | null = null;

function isFileDrag(dataTransfer: DataTransfer | null): boolean {
    if (!dataTransfer) {
        return false;
    }
    for (const type of dataTransfer.types) {
        if (type === "Files") {
            return true;
        }
    }
    return false;
}

function bindFileDropTarget(element: HTMLElement, onFile: (file: File) => void): void {
    element.addEventListener("dragenter", (event) => {
        event.preventDefault();
        if (!isFileDrag(event.dataTransfer)) {
            return;
        }
        element.classList.add("drag-over-file");
    });

    element.addEventListener("dragover", (event) => {
        event.preventDefault();
        const dataTransfer = event.dataTransfer;
        if (!dataTransfer) {
            return;
        }
        if (isFileDrag(dataTransfer)) {
            dataTransfer.dropEffect = "copy";
            element.classList.add("drag-over-file");
        } else {
            dataTransfer.dropEffect = "none";
            element.classList.remove("drag-over-file");
        }
    });

    element.addEventListener("dragleave", (event) => {
        const nextTarget = event.relatedTarget as Node | null;
        if (nextTarget && element.contains(nextTarget)) {
            return;
        }
        element.classList.remove("drag-over-file");
    });

    element.addEventListener("drop", (event) => {
        event.preventDefault();
        element.classList.remove("drag-over-file");
        const file = event.dataTransfer?.files.item(0);
        if (file) {
            onFile(file);
        }
    });
}

getVersion()
    .then((version) => setText("version", `qpdf ${version}`))
    .catch(() => setText("version", "qpdf version unavailable"));

// tab switching
document.querySelectorAll<HTMLButtonElement>(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".tab-button, .tab-panel").forEach((el) => el.classList.remove("active"));
        button.classList.add("active");
        document.getElementById(`tab-${button.dataset.tab}`)?.classList.add("active");
    });
});

// compress tab
const compressUpload = document.getElementById("compress-upload") as HTMLButtonElement;
const compressInput = document.getElementById("compress-input") as HTMLInputElement;
const levelSlider = document.getElementById("compression-level") as HTMLInputElement;

compressUpload.addEventListener("click", () => compressInput.click());
bindFileDropTarget(compressUpload, (file) => {
    void handleCompressFile(file);
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

    clearStatus("compress-status");
    setUploadLoading(compressUpload, COMPRESS_LOADER, true, "Reading file…");

    try {
        const arrayBuffer = await file.arrayBuffer();
        setText(COMPRESS_LOADER.labelId, "Compressing PDF…");
        const options = {
            compressionLevel: parseInt(levelSlider.value),
            decodeLevel: (document.getElementById("decode-level") as HTMLSelectElement).value as "none" | "generalized" | "specialized" | "all",
            recompressFlate: (document.getElementById("recompress-flate") as HTMLInputElement).checked,
            compressPages: (document.getElementById("compress-pages") as HTMLInputElement).checked,
            removeUnreferencedResources: (document.getElementById("remove-unreferenced") as HTMLInputElement).checked,
        };

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
    } finally {
        setUploadLoading(compressUpload, COMPRESS_LOADER, false);
    }
}

// split tab
const splitUpload = document.getElementById("split-upload") as HTMLButtonElement;
const splitInput = document.getElementById("split-input") as HTMLInputElement;
const downloadAllBtn = document.getElementById("download-all-btn") as HTMLButtonElement | null;

splitUpload.addEventListener("click", () => splitInput.click());
bindFileDropTarget(splitUpload, (file) => {
    void handleSplitFile(file);
});
splitInput.addEventListener("change", (event) => {
    const file = (event.target as HTMLInputElement).files?.item(0);
    if (file) void handleSplitFile(file);
});

downloadAllBtn?.addEventListener("click", () => {
    void handleDownloadAllZip();
});

async function handleDownloadAllZip(): Promise<void> {
    if (!downloadAllBtn || splitPagesData.length === 0) {
        return;
    }

    const entries: Record<string, Uint8Array> = {};
    splitPagesData.forEach((page, i) => {
        entries[`${splitFileName}_page_${i + 1}.pdf`] = page;
    });

    downloadAllBtn.disabled = true;
    downloadAllBtn.setAttribute("aria-busy", "true");

    try {
        const zipped = await new Promise<Uint8Array>((resolve, reject) => {
            zip(entries, { level: 0 }, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(data);
            });
        });
        downloadBlob(new Blob([new Uint8Array(zipped)], { type: "application/zip" }), `${splitFileName}_pages.zip`);
    } catch (error) {
        showStatus("split-status", `Error: ${error instanceof Error ? error.message : "Could not create ZIP"}`, "error");
    } finally {
        downloadAllBtn.disabled = false;
        downloadAllBtn.removeAttribute("aria-busy");
    }
}

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
    clearStatus("split-status");
    setUploadLoading(splitUpload, SPLIT_LOADER, true, "Reading file…");

    try {
        const arrayBuffer = await file.arrayBuffer();
        setText(SPLIT_LOADER.labelId, "Splitting pages…");
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
    } finally {
        setUploadLoading(splitUpload, SPLIT_LOADER, false);
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

// merge tab
const mergeUpload = document.getElementById("merge-upload") as HTMLButtonElement;
const mergeInput = document.getElementById("merge-input") as HTMLInputElement;
const mergeBtn = document.getElementById("merge-btn") as HTMLButtonElement | null;
const mergeDownloadBtn = document.getElementById("merge-download-btn") as HTMLButtonElement | null;

mergeUpload.addEventListener("click", () => mergeInput.click());

mergeUpload.addEventListener("dragenter", (event) => {
    event.preventDefault();
    if (!isFileDrag(event.dataTransfer)) return;
    mergeUpload.classList.add("drag-over-file");
});

mergeUpload.addEventListener("dragover", (event) => {
    event.preventDefault();
    const dt = event.dataTransfer;
    if (!dt) return;
    if (isFileDrag(dt)) {
        dt.dropEffect = "copy";
        mergeUpload.classList.add("drag-over-file");
    } else {
        dt.dropEffect = "none";
        mergeUpload.classList.remove("drag-over-file");
    }
});

mergeUpload.addEventListener("dragleave", (event) => {
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && mergeUpload.contains(nextTarget)) return;
    mergeUpload.classList.remove("drag-over-file");
});

mergeUpload.addEventListener("drop", (event) => {
    event.preventDefault();
    mergeUpload.classList.remove("drag-over-file");
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) addMergeFiles(files);
});

mergeInput.addEventListener("change", (event) => {
    const files = (event.target as HTMLInputElement).files;
    if (files && files.length > 0) {
        addMergeFiles(files);
        mergeInput.value = "";
    }
});

mergeBtn?.addEventListener("click", () => {
    void handleMerge();
});

mergeDownloadBtn?.addEventListener("click", () => {
    if (mergedData) downloadData(mergedData, "merged.pdf");
});

function addMergeFiles(files: FileList | File[]): void {
    const pdfs = Array.from(files).filter(isPdfFile);
    if (pdfs.length === 0) {
        showStatus("merge-status", "Please select PDF files only", "error");
        return;
    }
    mergeFiles.push(...pdfs);
    console.log("new merge files", mergeFiles);
    renderMergeFileList();
    clearStatus("merge-status");
    document.getElementById("merge-results")?.classList.remove("show");
    mergedData = null;
}

function removeMergeFile(index: number): void {
    mergeFiles.splice(index, 1);
    renderMergeFileList();
    document.getElementById("merge-results")?.classList.remove("show");
    mergedData = null;
}

function renderMergeFileList(): void {
    const list = document.getElementById("merge-file-list");
    const actions = document.getElementById("merge-actions");
    const hint = document.getElementById("merge-actions-hint");
    if (!list || !actions) return;

    if (mergeFiles.length === 0) {
        list.hidden = true;
        actions.hidden = true;
        return;
    }

    list.hidden = false;
    actions.hidden = false;

    if (mergeBtn) mergeBtn.disabled = mergeFiles.length < 2;
    if (hint) hint.textContent = mergeFiles.length < 2 ? "Add at least one more PDF" : `${mergeFiles.length} files ready`;

    list.innerHTML = "";
    mergeFiles.forEach((file, index) => {
        const label = document.createElement("div");
        label.className = "page-item-label";

        const icon = document.createElement("span");
        icon.className = "page-icon";
        icon.textContent = "PDF";

        const meta = document.createElement("div");
        const name = document.createElement("div");
        name.className = "page-name";
        name.textContent = file.name;
        const sizeEl = document.createElement("div");
        sizeEl.className = "page-size";
        sizeEl.textContent = formatBytes(file.size);
        meta.appendChild(name);
        meta.appendChild(sizeEl);

        label.appendChild(icon);
        label.appendChild(meta);

        const removeBtn = document.createElement("button");
        removeBtn.className = "button secondary small";
        removeBtn.type = "button";
        removeBtn.textContent = "Remove";
        removeBtn.addEventListener("click", () => removeMergeFile(index));

        const item = document.createElement("div");
        item.className = "page-item";
        item.appendChild(label);
        item.appendChild(removeBtn);
        list.appendChild(item);
    });
}

async function handleMerge(): Promise<void> {
    if (mergeFiles.length < 2) {
        showStatus("merge-status", "Please add at least 2 PDFs to merge", "error");
        return;
    }

    if (mergeBtn) {
        mergeBtn.disabled = true;
        mergeBtn.setAttribute("aria-busy", "true");
    }
    clearStatus("merge-status");
    document.getElementById("merge-results")?.classList.remove("show");

    try {
        const buffers = await Promise.all(mergeFiles.map((f) => f.arrayBuffer()));
        const totalInputBytes = buffers.reduce((sum, b) => sum + b.byteLength, 0);

        const startTime = performance.now();
        const result = await mergePdfs(buffers);
        const elapsedSeconds = (performance.now() - startTime) / 1000;

        mergedData = result.data;
        setText("merge-output-size", formatBytes(result.data.byteLength));
        setText("merge-file-count", String(result.sourceCount));
        setText("merge-processing-time", `${elapsedSeconds.toFixed(2)}s`);
        setText("merge-throughput", formatThroughputBytesPerSecond(totalInputBytes, elapsedSeconds));
        document.getElementById("merge-results")?.classList.add("show");
        showStatus("merge-status", `Successfully merged ${result.sourceCount} PDF${result.sourceCount > 1 ? "s" : ""}`, "success");
    } catch (error) {
        showStatus("merge-status", `Error: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
    } finally {
        if (mergeBtn) {
            mergeBtn.disabled = mergeFiles.length < 2;
            mergeBtn.removeAttribute("aria-busy");
        }
    }
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

function downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
}

function downloadData(data: Uint8Array, fileName: string): void {
    downloadBlob(new Blob([data as BlobPart], { type: "application/pdf" }), fileName);
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

function clearStatus(id: string): void {
    const element = document.getElementById(id);
    if (!element) return;
    element.textContent = "";
    element.className = "status";
}

type UploadLoaderIds = { labelId: string; loaderId: string };

function setUploadLoading(uploadButton: HTMLButtonElement, { labelId, loaderId }: UploadLoaderIds, loading: boolean, message = "Working…"): void {
    const loader = document.getElementById(loaderId);
    if (loading) {
        uploadButton.classList.add("is-loading");
        uploadButton.setAttribute("aria-busy", "true");
        uploadButton.disabled = true;
        loader?.setAttribute("aria-hidden", "false");
        setText(labelId, message);
    } else {
        uploadButton.classList.remove("is-loading");
        uploadButton.removeAttribute("aria-busy");
        uploadButton.disabled = false;
        loader?.setAttribute("aria-hidden", "true");
    }
}
