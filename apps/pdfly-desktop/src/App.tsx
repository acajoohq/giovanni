import { zip } from "fflate";
import { useCallback, useRef, useState } from "react";
import { compressPdf, formatBytes, getVersion, mergePdfs, splitPages } from "@pdfly/wasm";
import "./App.css";

// ── helpers ──────────────────────────────────────────────────────────────────

function isFileDrag(dt: DataTransfer | null): boolean {
    if (!dt) return false;
    return Array.from(dt.types).includes("Files");
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
    downloadBlob(new Blob([data], { type: "application/pdf" }), fileName);
}

function isPdfFile(file: File): boolean {
    return file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf");
}

function formatThroughput(bytes: number, secs: number): string {
    if (!isFinite(secs) || secs <= 0 || !isFinite(bytes) || bytes < 0) return "—";
    return `${formatBytes(bytes / secs)}/s`;
}

function formatPps(pages: number, secs: number): string {
    if (!isFinite(secs) || secs <= 0) return "—";
    return `${(pages / secs).toFixed(1)} p/s`;
}

// ── upload drop zone ──────────────────────────────────────────────────────────

interface UploadAreaProps {
    id: string;
    copy: string;
    isLoading: boolean;
    loaderLabel: string;
    onFile: (file: File) => void;
    multipleFiles?: boolean;
    onFiles?: (files: FileList) => void;
    children?: React.ReactNode;
}

function UploadArea({ id, copy, isLoading, loaderLabel, onFile, multipleFiles, onFiles }: UploadAreaProps) {
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (!isFileDrag(e.dataTransfer)) return;
        if (multipleFiles && onFiles && e.dataTransfer.files.length > 0) {
            onFiles(e.dataTransfer.files);
        } else {
            const file = e.dataTransfer.files.item(0);
            if (file) onFile(file);
        }
    };

    return (
        <>
            <button
                type="button"
                className={`upload-area${isLoading ? " is-loading" : ""}${dragOver ? " drag-over-file" : ""}`}
                disabled={isLoading}
                onClick={() => inputRef.current?.click()}
                onDragEnter={(e) => {
                    e.preventDefault();
                    if (isFileDrag(e.dataTransfer)) setDragOver(true);
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    if (isFileDrag(e.dataTransfer)) {
                        e.dataTransfer.dropEffect = "copy";
                        setDragOver(true);
                    } else setDragOver(false);
                }}
                onDragLeave={(e) => {
                    const next = e.relatedTarget as Node | null;
                    if (!next || !e.currentTarget.contains(next)) setDragOver(false);
                }}
                onDrop={handleDrop}
            >
                <svg className="upload-icon" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 0 1-.88-7.903A5 5 0 0 1 15.9 6H16a5 5 0 0 1 1 9.9M15 13l-3-3m0 0-3 3m3-3v12"
                    />
                </svg>
                <span className="upload-title">
                    <span className="upload-title--default">{multipleFiles ? "Drop PDFs here or click to add files" : "Drop PDF here or click to upload"}</span>
                    <span className="upload-title--drop" aria-hidden="true">
                        {multipleFiles ? "Release to add PDFs" : "Release to upload your PDF"}
                    </span>
                </span>
                <span className="upload-copy">{copy}</span>
                <div className="upload-loader" aria-hidden={!isLoading}>
                    <span className="spinner" aria-hidden="true" />
                    <span className="upload-loader-label" aria-live="polite">
                        {loaderLabel}
                    </span>
                </div>
            </button>
            <input
                ref={inputRef}
                id={id}
                className="visually-hidden"
                type="file"
                accept=".pdf,application/pdf"
                multiple={multipleFiles}
                onChange={(e) => {
                    const files = e.target.files;
                    if (!files || files.length === 0) return;
                    if (multipleFiles && onFiles) {
                        onFiles(files);
                    } else if (files.item(0)) {
                        onFile(files.item(0)!);
                    }
                    e.target.value = "";
                }}
            />
        </>
    );
}

// ── status message ────────────────────────────────────────────────────────────

function Status({ message, type }: { message: string; type: "info" | "success" | "error" | "" }) {
    return <div className={`status${type ? ` ${type}` : ""}`}>{message}</div>;
}

// ── Compress tab ──────────────────────────────────────────────────────────────

interface CompressOptions {
    compressionLevel: number;
    decodeLevel: "none" | "generalized" | "specialized" | "all";
    recompressFlate: boolean;
    compressPages: boolean;
    removeUnreferencedResources: boolean;
}

interface CompressResult {
    data: Uint8Array;
    originalSize: number;
    compressedSize: number;
    savedBytes: number;
    processingTime: string;
    throughput: string;
    savingsPercent: string;
}

function CompressTab() {
    const [options, setOptions] = useState<CompressOptions>({
        compressionLevel: 6,
        decodeLevel: "generalized",
        recompressFlate: true,
        compressPages: false,
        removeUnreferencedResources: false,
    });
    const [loading, setLoading] = useState(false);
    const [loaderLabel, setLoaderLabel] = useState("Working…");
    const [status, setStatus] = useState<{ message: string; type: "info" | "success" | "error" | "" }>({ message: "", type: "" });
    const [result, setResult] = useState<CompressResult | null>(null);

    const handleFile = useCallback(
        async (file: File) => {
            if (!isPdfFile(file)) {
                setStatus({ message: "Please select a PDF file", type: "error" });
                return;
            }
            setStatus({ message: "", type: "" });
            setLoading(true);
            setLoaderLabel("Reading file…");
            try {
                const buf = await file.arrayBuffer();
                setLoaderLabel("Compressing PDF…");
                const t0 = performance.now();
                const r = await compressPdf(buf, options);
                const secs = (performance.now() - t0) / 1000;
                setResult({
                    data: r.data,
                    originalSize: r.originalSize,
                    compressedSize: r.compressedSize,
                    savedBytes: r.savedBytes,
                    processingTime: `${secs.toFixed(2)}s`,
                    throughput: formatThroughput(r.originalSize, secs),
                    savingsPercent: `${((r.savedBytes / r.originalSize) * 100).toFixed(1)}% saved`,
                });
                setStatus({ message: "Compression complete!", type: "success" });
            } catch (err) {
                setStatus({ message: `Error: ${err instanceof Error ? err.message : "Unknown error"}`, type: "error" });
            } finally {
                setLoading(false);
            }
        },
        [options],
    );

    return (
        <section className="tab-panel active">
            <UploadArea id="compress-input" copy="Your file never leaves your device" isLoading={loading} loaderLabel={loaderLabel} onFile={handleFile} />

            <div className="options">
                <label className="option-group">
                    <span>
                        Compression Level: <strong>{options.compressionLevel}</strong>
                    </span>
                    <input
                        type="range"
                        min={1}
                        max={9}
                        value={options.compressionLevel}
                        onChange={(e) => setOptions((o) => ({ ...o, compressionLevel: Number(e.target.value) }))}
                    />
                    <small>1 = fastest, 9 = best compression</small>
                </label>
                <label className="option-group">
                    <span>Decode Level</span>
                    <select value={options.decodeLevel} onChange={(e) => setOptions((o) => ({ ...o, decodeLevel: e.target.value as CompressOptions["decodeLevel"] }))}>
                        <option value="none">None - do not decode anything</option>
                        <option value="generalized">Generalized - decode common filters</option>
                        <option value="specialized">Specialized - decode JPEG and similar filters</option>
                        <option value="all">All - maximum compression</option>
                    </select>
                </label>
                <div className="option-group">
                    <span>Advanced Options</span>
                    <label className="checkbox-label">
                        <input type="checkbox" checked={options.recompressFlate} onChange={(e) => setOptions((o) => ({ ...o, recompressFlate: e.target.checked }))} /> Recompress
                        flate streams
                    </label>
                    <label className="checkbox-label">
                        <input type="checkbox" checked={options.compressPages} onChange={(e) => setOptions((o) => ({ ...o, compressPages: e.target.checked }))} /> Compress pages
                    </label>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={options.removeUnreferencedResources}
                            onChange={(e) => setOptions((o) => ({ ...o, removeUnreferencedResources: e.target.checked }))}
                        />{" "}
                        Remove unreferenced resources
                    </label>
                </div>
            </div>

            <Status {...status} />

            {result && (
                <div className="results show">
                    <h2>Compression Results</h2>
                    <div className="savings">{result.savingsPercent}</div>
                    <div className="stats">
                        <div className="stat">
                            <div className="stat-label">Original Size</div>
                            <div className="stat-value">{formatBytes(result.originalSize)}</div>
                        </div>
                        <div className="stat">
                            <div className="stat-label">Compressed Size</div>
                            <div className="stat-value">{formatBytes(result.compressedSize)}</div>
                        </div>
                        <div className="stat">
                            <div className="stat-label">Saved</div>
                            <div className="stat-value">{formatBytes(result.savedBytes)}</div>
                        </div>
                        <div className="stat">
                            <div className="stat-label">Processing Time</div>
                            <div className="stat-value">{result.processingTime}</div>
                        </div>
                        <div className="stat">
                            <div className="stat-label">Throughput</div>
                            <div className="stat-value">{result.throughput}</div>
                        </div>
                    </div>
                    <button className="button" type="button" onClick={() => downloadData(result.data, "compressed.pdf")}>
                        Download Compressed PDF
                    </button>
                </div>
            )}
        </section>
    );
}

// ── Split tab ─────────────────────────────────────────────────────────────────

const SPLIT_PAGE_SIZE = 10;

interface SplitResult {
    pages: Uint8Array[];
    pageCount: number;
    processingTime: string;
    pps: string;
    throughput: string;
    baseName: string;
}

function SplitTab() {
    const [loading, setLoading] = useState(false);
    const [loaderLabel, setLoaderLabel] = useState("Working…");
    const [status, setStatus] = useState<{ message: string; type: "info" | "success" | "error" | "" }>({ message: "", type: "" });
    const [result, setResult] = useState<SplitResult | null>(null);
    const [pageIndex, setPageIndex] = useState(0);

    const handleFile = useCallback(async (file: File) => {
        if (!isPdfFile(file)) {
            setStatus({ message: "Please select a PDF file", type: "error" });
            return;
        }
        setStatus({ message: "", type: "" });
        setLoading(true);
        setLoaderLabel("Reading file…");
        try {
            const buf = await file.arrayBuffer();
            setLoaderLabel("Splitting pages…");
            const t0 = performance.now();
            const r = await splitPages(buf);
            const secs = (performance.now() - t0) / 1000;
            setResult({
                pages: r.pages,
                pageCount: r.pageCount,
                processingTime: `${secs.toFixed(2)}s`,
                pps: formatPps(r.pageCount, secs),
                throughput: formatThroughput(buf.byteLength, secs),
                baseName: file.name.replace(/\.pdf$/i, "") || "document",
            });
            setPageIndex(0);
            const label = r.pageCount === 1 ? "page" : "pages";
            setStatus({ message: `Successfully split into ${r.pageCount} ${label}`, type: "success" });
        } catch (err) {
            setStatus({ message: `Error: ${err instanceof Error ? err.message : "Unknown error"}`, type: "error" });
        } finally {
            setLoading(false);
        }
    }, []);

    const handleDownloadAll = useCallback(async () => {
        if (!result || result.pages.length === 0) return;
        const entries: Record<string, Uint8Array> = {};
        result.pages.forEach((p, i) => {
            entries[`${result.baseName}_page_${i + 1}.pdf`] = p;
        });
        try {
            const zipped = await new Promise<Uint8Array>((resolve, reject) => {
                zip(entries, { level: 0 }, (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                });
            });
            downloadBlob(new Blob([zipped], { type: "application/zip" }), `${result.baseName}_pages.zip`);
        } catch (err) {
            setStatus({ message: `Error: ${err instanceof Error ? err.message : "Could not create ZIP"}`, type: "error" });
        }
    }, [result]);

    const pages = result?.pages ?? [];
    const total = pages.length;
    const pageCount = Math.ceil(total / SPLIT_PAGE_SIZE);
    const safeIndex = Math.min(pageIndex, Math.max(0, pageCount - 1));
    const sliceStart = safeIndex * SPLIT_PAGE_SIZE;
    const sliceEnd = Math.min(sliceStart + SPLIT_PAGE_SIZE, total);
    const visiblePages = pages.slice(sliceStart, sliceEnd);

    return (
        <section className="tab-panel active">
            <UploadArea id="split-input" copy="Each page will be extracted as a separate PDF" isLoading={loading} loaderLabel={loaderLabel} onFile={handleFile} />
            <Status {...status} />

            {result && (
                <div className="split-results show">
                    <div className="split-header">
                        <h2>
                            {result.pageCount} {result.pageCount === 1 ? "page" : "pages"} extracted
                        </h2>
                        <button className="button secondary" type="button" onClick={handleDownloadAll}>
                            Download ZIP
                        </button>
                    </div>
                    <div className="stats split-speed-stats">
                        <div className="stat">
                            <div className="stat-label">Processing Time</div>
                            <div className="stat-value">{result.processingTime}</div>
                        </div>
                        <div className="stat">
                            <div className="stat-label">Pages / second</div>
                            <div className="stat-value">{result.pps}</div>
                        </div>
                        <div className="stat">
                            <div className="stat-label">Input throughput</div>
                            <div className="stat-value">{result.throughput}</div>
                        </div>
                    </div>
                    <div className="pages-list">
                        {visiblePages.map((page, i) => {
                            const idx = sliceStart + i;
                            const fileName = `${result.baseName}_page_${idx + 1}.pdf`;
                            return (
                                <div key={idx} className="page-item">
                                    <div className="page-item-label">
                                        <span className="page-icon">PDF</span>
                                        <div>
                                            <div className="page-name">{fileName}</div>
                                            <div className="page-size">{formatBytes(page.byteLength)}</div>
                                        </div>
                                    </div>
                                    <button className="button secondary small" type="button" onClick={() => downloadData(page, fileName)}>
                                        Download
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                    {total > SPLIT_PAGE_SIZE && (
                        <div className="split-pagination">
                            <button className="button secondary small" type="button" disabled={safeIndex <= 0} onClick={() => setPageIndex((i) => i - 1)}>
                                Previous
                            </button>
                            <span className="split-page-info">
                                Showing {sliceStart + 1}–{sliceEnd} of {total} · list {safeIndex + 1} / {pageCount}
                            </span>
                            <button className="button secondary small" type="button" disabled={safeIndex >= pageCount - 1} onClick={() => setPageIndex((i) => i + 1)}>
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}

// ── Merge tab ─────────────────────────────────────────────────────────────────

interface MergeResult {
    data: Uint8Array;
    outputSize: string;
    fileCount: number;
    processingTime: string;
    throughput: string;
}

function MergeTab() {
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ message: string; type: "info" | "success" | "error" | "" }>({ message: "", type: "" });
    const [result, setResult] = useState<MergeResult | null>(null);

    const addFiles = useCallback((incoming: FileList | File[]) => {
        const pdfs = Array.from(incoming).filter(isPdfFile);
        if (pdfs.length === 0) {
            setStatus({ message: "Please select PDF files only", type: "error" });
            return;
        }
        setFiles((prev) => [...prev, ...pdfs]);
        setStatus({ message: "", type: "" });
        setResult(null);
    }, []);

    const removeFile = useCallback((index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
        setResult(null);
    }, []);

    const handleMerge = useCallback(async () => {
        if (files.length < 2) {
            setStatus({ message: "Please add at least 2 PDFs to merge", type: "error" });
            return;
        }
        setLoading(true);
        setStatus({ message: "", type: "" });
        setResult(null);
        try {
            const buffers = await Promise.all(files.map((f) => f.arrayBuffer()));
            const totalBytes = buffers.reduce((s, b) => s + b.byteLength, 0);
            const t0 = performance.now();
            const r = await mergePdfs(buffers);
            const secs = (performance.now() - t0) / 1000;
            setResult({
                data: r.data,
                outputSize: formatBytes(r.data.byteLength),
                fileCount: r.sourceCount,
                processingTime: `${secs.toFixed(2)}s`,
                throughput: formatThroughput(totalBytes, secs),
            });
            setStatus({ message: `Successfully merged ${r.sourceCount} PDF${r.sourceCount > 1 ? "s" : ""}`, type: "success" });
        } catch (err) {
            setStatus({ message: `Error: ${err instanceof Error ? err.message : "Unknown error"}`, type: "error" });
        } finally {
            setLoading(false);
        }
    }, [files]);

    return (
        <section className="tab-panel active">
            <UploadArea
                id="merge-input"
                copy="Select multiple PDFs to merge into one"
                isLoading={false}
                loaderLabel="Working…"
                onFile={(f) => addFiles([f])}
                multipleFiles
                onFiles={addFiles}
            />

            {files.length > 0 && (
                <>
                    <div className="merge-file-list">
                        {files.map((file, i) => (
                            <div key={i} className="page-item">
                                <div className="page-item-label">
                                    <span className="page-icon">PDF</span>
                                    <div>
                                        <div className="page-name">{file.name}</div>
                                        <div className="page-size">{formatBytes(file.size)}</div>
                                    </div>
                                </div>
                                <button className="button secondary small" type="button" onClick={() => removeFile(i)}>
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="merge-actions">
                        <span className="merge-actions-hint">{files.length < 2 ? "Add at least one more PDF" : `${files.length} files ready`}</span>
                        <button className="button" type="button" disabled={files.length < 2 || loading} aria-busy={loading} onClick={handleMerge}>
                            Merge PDFs
                        </button>
                    </div>
                </>
            )}

            <Status {...status} />

            {result && (
                <div className="results show">
                    <h2>Merge Results</h2>
                    <div className="stats">
                        <div className="stat">
                            <div className="stat-label">Output Size</div>
                            <div className="stat-value">{result.outputSize}</div>
                        </div>
                        <div className="stat">
                            <div className="stat-label">Files Merged</div>
                            <div className="stat-value">{String(result.fileCount)}</div>
                        </div>
                        <div className="stat">
                            <div className="stat-label">Processing Time</div>
                            <div className="stat-value">{result.processingTime}</div>
                        </div>
                        <div className="stat">
                            <div className="stat-label">Throughput</div>
                            <div className="stat-value">{result.throughput}</div>
                        </div>
                    </div>
                    <button className="button" type="button" onClick={() => downloadData(result.data, "merged.pdf")}>
                        Download Merged PDF
                    </button>
                </div>
            )}
        </section>
    );
}

// ── App ───────────────────────────────────────────────────────────────────────

type TabId = "compress" | "split" | "merge";

function App() {
    const [tab, setTab] = useState<TabId>("compress");
    const [version, setVersion] = useState<string>("Loading version...");

    useState(() => {
        getVersion()
            .then((v) => setVersion(`qpdf ${v}`))
            .catch(() => setVersion("qpdf version unavailable"));
    });

    return (
        <>
            <main className="container">
                <header className="hero">
                    <h1>Pdfly</h1>
                    <p>PDF tools powered by qpdf and WebAssembly</p>
                </header>

                <div className="tabs">
                    {(["compress", "split", "merge"] as TabId[]).map((t) => (
                        <button key={t} type="button" className={`tab-button${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
                            {t === "compress" ? "Compress" : t === "split" ? "Split Pages" : "Merge"}
                        </button>
                    ))}
                </div>

                {tab === "compress" && <CompressTab />}
                {tab === "split" && <SplitTab />}
                {tab === "merge" && <MergeTab />}
            </main>

            <footer className="footer">
                <p>
                    Powered by{" "}
                    <a href="https://github.com/qpdf/qpdf" rel="noreferrer" target="_blank">
                        qpdf
                    </a>{" "}
                    compiled to WebAssembly
                </p>
                <p>{version}</p>
            </footer>
        </>
    );
}

export default App;
