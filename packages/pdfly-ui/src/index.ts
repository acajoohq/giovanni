import "./styles.css";
import { zip } from "fflate";
import type { ExtractedImage, PdfPageJpg } from "@pdfly/wasm";
import { compressPdf, extractImages, formatBytes, getVersion, mergePdfs, pdfToJpg, splitPages } from "@pdfly/wasm";

export function initApp(): void {
    const SPLIT_LIST_PAGE_SIZE = 10;

    const COMPRESS_LOADER = { labelId: "compress-loader-label", loaderId: "compress-loader" } as const;
    const SPLIT_LOADER = { labelId: "split-loader-label", loaderId: "split-loader" } as const;
    const IMAGES_LOADER = { labelId: "images-loader-label", loaderId: "images-loader" } as const;
    const JPEG_LOADER = { labelId: "jpg-loader-label", loaderId: "jpg-loader" } as const;

    let compressedData: Uint8Array | null = null;
    let splitPagesData: Uint8Array[] = [];
    let splitFileName = "document";
    let splitListPageIndex = 0;

    const mergeFiles: File[] = [];
    let mergedData: Uint8Array | null = null;

    let extractedImages: ExtractedImage[] = [];
    let extractedImagesObjectUrls: string[] = [];
    let extractedImagesFileName = "document";

    let jpgPages: PdfPageJpg[] = [];
    let jpgPageObjectUrls: string[] = [];
    let jpgFileName = "document";

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
        setUploadLoading(compressUpload, COMPRESS_LOADER, true, "Reading file...");

        try {
            const arrayBuffer = await file.arrayBuffer();
            setText(COMPRESS_LOADER.labelId, "Compressing PDF...");
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
            const savingsPercent = ((result.savedBytes / result.originalSize) * 100).toFixed(1);

            compressedData = result.data;
            setText("savings", `${savingsPercent}% saved`);
            setText("original-size", formatBytes(result.originalSize));
            setText("compressed-size", formatBytes(result.compressedSize));
            setText("saved-size", formatBytes(result.savedBytes));
            setText("processing-time", `${elapsedSeconds.toFixed(2)}s`);
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
        setUploadLoading(splitUpload, SPLIT_LOADER, true, "Reading file...");

        try {
            const arrayBuffer = await file.arrayBuffer();
            setText(SPLIT_LOADER.labelId, "Splitting pages...");
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
        info.textContent = `Showing ${rangeStart}-${rangeEnd} of ${totalItemCount} · list ${splitListPageIndex + 1} / ${listPageCount}`;

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

    // extract images tab (optional markup - e.g. pdfly-web includes it, pdfly-desktop may not)
    const imagesUploadCandidate = document.getElementById("images-upload");
    const imagesInputCandidate = document.getElementById("images-input");
    if (imagesUploadCandidate instanceof HTMLButtonElement && imagesInputCandidate instanceof HTMLInputElement) {
        const imagesUpload = imagesUploadCandidate;
        const imagesInput = imagesInputCandidate;
        const downloadAllImagesBtn = document.getElementById("download-all-images-btn") as HTMLButtonElement | null;

        imagesUpload.addEventListener("click", () => imagesInput.click());
        bindFileDropTarget(imagesUpload, (file) => {
            void handleExtractImagesFile(file);
        });
        imagesInput.addEventListener("change", (event) => {
            const file = (event.target as HTMLInputElement).files?.item(0);
            if (file) void handleExtractImagesFile(file);
        });

        downloadAllImagesBtn?.addEventListener("click", () => {
            void handleDownloadAllImagesZip();
        });

        async function handleExtractImagesFile(file: File): Promise<void> {
            if (!isPdfFile(file)) {
                showStatus("images-status", "Please select a PDF file", "error");
                return;
            }

            extractedImagesFileName = file.name.replace(/\.pdf$/i, "") || "document";
            clearStatus("images-status");
            setUploadLoading(imagesUpload, IMAGES_LOADER, true, "Reading file...");
            revokeImageObjectUrls();

            try {
                const arrayBuffer = await file.arrayBuffer();
                setText(IMAGES_LOADER.labelId, "Extracting images...");
                const startTime = performance.now();
                const result = await extractImages(arrayBuffer);
                const elapsedSeconds = (performance.now() - startTime) / 1000;

                extractedImages = result.images;
                const noun = result.imageCount === 1 ? "image" : "images";
                setText("images-title", `${result.imageCount} ${noun} extracted`);
                setText("images-processing-time", `${elapsedSeconds.toFixed(2)}s`);
                setText("images-per-sec", formatImagesPerSecond(result.imageCount, elapsedSeconds));
                setText("images-throughput", formatThroughputBytesPerSecond(arrayBuffer.byteLength, elapsedSeconds));

                renderImagesGrid(result.images, extractedImagesFileName);
                document.getElementById("images-results")?.classList.add("show");

                const decodedCount = result.images.filter((image) => image.blob !== null).length;
                const skippedCount = result.imageCount - decodedCount;
                const messageParts = [`Extracted ${decodedCount} ${decodedCount === 1 ? "image" : "images"}`];
                if (skippedCount > 0) {
                    messageParts.push(`${skippedCount} skipped (unsupported filter or color space)`);
                }
                showStatus("images-status", messageParts.join(" · "), result.imageCount > 0 ? "success" : "info");

                if (downloadAllImagesBtn) {
                    downloadAllImagesBtn.disabled = decodedCount === 0;
                }
            } catch (error) {
                showStatus("images-status", `Error: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
            } finally {
                setUploadLoading(imagesUpload, IMAGES_LOADER, false);
            }
        }

        function renderImagesGrid(images: ExtractedImage[], baseName: string): void {
            const grid = document.getElementById("images-grid");
            if (!grid) return;

            grid.innerHTML = "";

            if (images.length === 0) {
                const empty = document.createElement("p");
                empty.className = "page-name";
                empty.style.padding = "16px";
                empty.textContent = "No images found in this PDF.";
                grid.appendChild(empty);
                return;
            }

            images.forEach((image, index) => {
                const card = document.createElement("div");
                card.className = "image-card";

                const thumb = document.createElement("div");
                thumb.className = "image-card-thumb";

                if (image.blob) {
                    const url = URL.createObjectURL(image.blob);
                    extractedImagesObjectUrls.push(url);
                    const img = document.createElement("img");
                    img.src = url;
                    img.alt = `Image ${index + 1} from page ${image.pageIndex + 1}`;
                    img.loading = "lazy";
                    thumb.appendChild(img);
                } else {
                    thumb.classList.add("unsupported");
                    thumb.textContent = image.unsupportedReason ?? "Unable to decode";
                }

                const meta = document.createElement("div");
                meta.className = "image-card-meta";
                const dims = document.createElement("div");
                dims.innerHTML = `<strong>${image.width}&#xD7;${image.height}</strong> · ${formatBytes(image.bytes.byteLength)}`;
                const filterLine = document.createElement("div");
                filterLine.className = "filter";
                filterLine.textContent = `${image.filter} · page ${image.pageIndex + 1}`;
                meta.appendChild(dims);
                meta.appendChild(filterLine);

                const actions = document.createElement("div");
                actions.className = "image-card-actions";
                const button = document.createElement("button");
                button.className = "button secondary small";
                button.type = "button";
                button.textContent = image.blob ? "Download" : "Raw bytes";
                button.addEventListener("click", () => {
                    const fileName = imageDownloadName(baseName, index, image);
                    if (image.blob) {
                        downloadBlob(image.blob, fileName);
                    } else {
                        downloadBlob(new Blob([image.bytes as BlobPart], { type: "application/octet-stream" }), fileName);
                    }
                });
                actions.appendChild(button);

                card.appendChild(thumb);
                card.appendChild(meta);
                card.appendChild(actions);
                grid.appendChild(card);
            });
        }

        function imageDownloadName(baseName: string, index: number, image: ExtractedImage): string {
            const ordinal = String(index + 1).padStart(3, "0");
            const extension = mimeTypeToExtension(image.mimeType, image.filter);
            return `${baseName}_image_${ordinal}.${extension}`;
        }

        function mimeTypeToExtension(mimeType: string | null, filter: string): string {
            if (mimeType === "image/jpeg") return "jpg";
            if (mimeType === "image/jp2") return "jp2";
            if (mimeType === "image/png") return "png";
            if (filter === "CCITTFaxDecode") return "ccitt.bin";
            if (filter === "JBIG2Decode") return "jbig2.bin";
            return "bin";
        }

        async function handleDownloadAllImagesZip(): Promise<void> {
            if (!downloadAllImagesBtn || extractedImages.length === 0) {
                return;
            }

            downloadAllImagesBtn.disabled = true;
            downloadAllImagesBtn.setAttribute("aria-busy", "true");

            try {
                const entries: Record<string, Uint8Array> = {};
                for (const [index, image] of extractedImages.entries()) {
                    if (!image.blob) {
                        continue;
                    }
                    const fileName = imageDownloadName(extractedImagesFileName, index, image);
                    entries[fileName] = new Uint8Array(await image.blob.arrayBuffer());
                }

                if (Object.keys(entries).length === 0) {
                    showStatus("images-status", "Nothing to bundle: no images were decoded.", "error");
                    return;
                }

                const zipped = await new Promise<Uint8Array>((resolve, reject) => {
                    zip(entries, { level: 6 }, (err, data) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(data);
                    });
                });
                downloadBlob(new Blob([new Uint8Array(zipped)], { type: "application/zip" }), `${extractedImagesFileName}_images.zip`);
            } catch (error) {
                showStatus("images-status", `Error: ${error instanceof Error ? error.message : "Could not create ZIP"}`, "error");
            } finally {
                downloadAllImagesBtn.disabled = false;
                downloadAllImagesBtn.removeAttribute("aria-busy");
            }
        }

        function revokeImageObjectUrls(): void {
            for (const url of extractedImagesObjectUrls) {
                URL.revokeObjectURL(url);
            }
            extractedImagesObjectUrls = [];
        }

        function formatImagesPerSecond(imageCount: number, elapsedSeconds: number): string {
            if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0 || !Number.isFinite(imageCount) || imageCount < 0) {
                return "-";
            }

            return `${(imageCount / elapsedSeconds).toFixed(1)} img/s`;
        }
    }

    // pdf to jpg tab (optional markup -- only present in pdfly-web)
    const jpgUploadCandidate = document.getElementById("jpg-upload");
    const jpgInputCandidate = document.getElementById("jpg-input");
    if (jpgUploadCandidate instanceof HTMLButtonElement && jpgInputCandidate instanceof HTMLInputElement) {
        const jpgUpload = jpgUploadCandidate;
        const jpgInput = jpgInputCandidate;
        const downloadAllJpgBtn = document.getElementById("download-all-jpg-btn") as HTMLButtonElement | null;
        const jpgQualitySlider = document.getElementById("jpg-quality") as HTMLInputElement | null;

        jpgUpload.addEventListener("click", () => jpgInput.click());
        bindFileDropTarget(jpgUpload, (file) => {
            void handleJpgFile(file);
        });
        jpgInput.addEventListener("change", (event) => {
            const file = (event.target as HTMLInputElement).files?.item(0);
            if (file) void handleJpgFile(file);
        });

        jpgQualitySlider?.addEventListener("input", () => {
            setText("jpg-quality-value", jpgQualitySlider.value);
        });

        const jpgScaleSliderEl = document.getElementById("jpg-scale") as HTMLInputElement | null;
        jpgScaleSliderEl?.addEventListener("input", () => {
            setText("jpg-scale-value", jpgScaleSliderEl.value);
        });

        downloadAllJpgBtn?.addEventListener("click", () => {
            void handleDownloadAllJpgZip();
        });

        async function handleJpgFile(file: File): Promise<void> {
            if (!isPdfFile(file)) {
                showStatus("jpg-status", "Please select a PDF file", "error");
                return;
            }

            jpgFileName = file.name.replace(/\.pdf$/i, "") || "document";
            clearStatus("jpg-status");
            setUploadLoading(jpgUpload, JPEG_LOADER, true, "Reading file...");
            revokeJpgObjectUrls();

            try {
                const arrayBuffer = await file.arrayBuffer();
                setText(JPEG_LOADER.labelId, "Converting to JPG...");
                const quality = jpgQualitySlider ? parseInt(jpgQualitySlider.value) / 100 : 0.92;
                const scale = jpgScaleSliderEl ? parseFloat(jpgScaleSliderEl.value) : 2.0;

                const startTime = performance.now();
                const result = await pdfToJpg(arrayBuffer, { quality, scale });
                const elapsedSeconds = (performance.now() - startTime) / 1000;

                jpgPages = result.pages;
                const noun = result.convertedPageCount === 1 ? "page" : "pages";
                setText("jpg-title", `${result.convertedPageCount} ${noun} converted`);
                setText("jpg-processing-time", `${elapsedSeconds.toFixed(2)}s`);
                setText("jpg-page-count", String(result.convertedPageCount));
                setText("jpg-throughput", formatThroughputBytesPerSecond(arrayBuffer.byteLength, elapsedSeconds));

                renderJpgGrid(result.pages, jpgFileName);
                document.getElementById("jpg-results")?.classList.add("show");

                if (result.convertedPageCount === 0) {
                    showStatus("jpg-status", "The PDF appears to have no pages.", "info");
                } else {
                    showStatus("jpg-status", `Converted ${result.convertedPageCount} ${noun} to JPG`, "success");
                }

                if (downloadAllJpgBtn) {
                    downloadAllJpgBtn.disabled = result.convertedPageCount === 0;
                }
            } catch (error) {
                showStatus("jpg-status", `Error: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
            } finally {
                setUploadLoading(jpgUpload, JPEG_LOADER, false);
            }
        }

        function renderJpgGrid(pages: PdfPageJpg[], baseName: string): void {
            const grid = document.getElementById("jpg-grid");
            if (!grid) return;

            grid.innerHTML = "";

            if (pages.length === 0) {
                const empty = document.createElement("p");
                empty.className = "page-name";
                empty.style.padding = "16px";
                empty.textContent = "No images could be extracted from this PDF.";
                grid.appendChild(empty);
                return;
            }

            pages.forEach((page) => {
                const card = document.createElement("div");
                card.className = "image-card";

                const thumb = document.createElement("div");
                thumb.className = "image-card-thumb";

                const url = URL.createObjectURL(page.blob);
                jpgPageObjectUrls.push(url);
                const img = document.createElement("img");
                img.src = url;
                img.alt = `Page ${page.pageIndex + 1}`;
                img.loading = "lazy";
                thumb.appendChild(img);

                const meta = document.createElement("div");
                meta.className = "image-card-meta";
                const dims = document.createElement("div");
                dims.innerHTML = `<strong>${page.width}&#xD7;${page.height}</strong>`;
                const pageLine = document.createElement("div");
                pageLine.className = "filter";
                pageLine.textContent = `page ${page.pageIndex + 1}`;
                meta.appendChild(dims);
                meta.appendChild(pageLine);

                const actions = document.createElement("div");
                actions.className = "image-card-actions";
                const button = document.createElement("button");
                button.className = "button secondary small";
                button.type = "button";
                button.textContent = "Download";
                button.addEventListener("click", () => {
                    const fileName = `${baseName}_page_${String(page.pageIndex + 1).padStart(3, "0")}.jpg`;
                    downloadBlob(page.blob, fileName);
                });
                actions.appendChild(button);

                card.appendChild(thumb);
                card.appendChild(meta);
                card.appendChild(actions);
                grid.appendChild(card);
            });
        }

        async function handleDownloadAllJpgZip(): Promise<void> {
            if (!downloadAllJpgBtn || jpgPages.length === 0) return;

            downloadAllJpgBtn.disabled = true;
            downloadAllJpgBtn.setAttribute("aria-busy", "true");

            try {
                const entries: Record<string, Uint8Array> = {};
                for (const page of jpgPages) {
                    const fileName = `${jpgFileName}_page_${String(page.pageIndex + 1).padStart(3, "0")}.jpg`;
                    entries[fileName] = new Uint8Array(await page.blob.arrayBuffer());
                }

                const zipped = await new Promise<Uint8Array>((resolve, reject) => {
                    zip(entries, { level: 0 }, (err, data) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(data);
                    });
                });
                downloadBlob(new Blob([new Uint8Array(zipped)], { type: "application/zip" }), `${jpgFileName}_jpg.zip`);
            } catch (error) {
                showStatus("jpg-status", `Error: ${error instanceof Error ? error.message : "Could not create ZIP"}`, "error");
            } finally {
                downloadAllJpgBtn.disabled = false;
                downloadAllJpgBtn.removeAttribute("aria-busy");
            }
        }

        function revokeJpgObjectUrls(): void {
            for (const url of jpgPageObjectUrls) {
                URL.revokeObjectURL(url);
            }
            jpgPageObjectUrls = [];
        }
    }
    function formatThroughputBytesPerSecond(byteLength: number, elapsedSeconds: number): string {
        if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0 || !Number.isFinite(byteLength) || byteLength < 0) {
            return "-";
        }
        return `${formatBytes(byteLength / elapsedSeconds)}/s`;
    }

    function formatPagesPerSecond(pageCount: number, elapsedSeconds: number): string {
        if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0 || !Number.isFinite(pageCount) || pageCount < 0) {
            return "-";
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

    function setUploadLoading(uploadButton: HTMLButtonElement, { labelId, loaderId }: UploadLoaderIds, loading: boolean, message = "Working..."): void {
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
}
