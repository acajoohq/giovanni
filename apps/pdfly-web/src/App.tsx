import JSZip from "jszip";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { compressPdf, formatBytes, getVersion, splitPages, type CompressionOptions, type DecodeLevel } from "@pdfly/wasm";

type ActiveTab = "compress" | "split";
type StatusType = "info" | "success" | "error";

interface StatusMessage {
    message: string;
    type: StatusType;
}

interface CompressionStats {
    compressedData: Uint8Array;
    compressedSize: number;
    originalSize: number;
    processingTime: string;
    savedBytes: number;
    savingsPercent: string;
}

interface SplitPage {
    data: Uint8Array;
    fileName: string;
}

const isPdfFile = (file: File) => file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf");

const toArrayBuffer = (data: Uint8Array) => {
    const arrayBuffer = new ArrayBuffer(data.byteLength);
    new Uint8Array(arrayBuffer).set(data);

    return arrayBuffer;
};

const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) {
        return error.message;
    }

    return "Unknown error";
};

const downloadData = (data: Blob | Uint8Array, fileName: string, type = "application/pdf") => {
    const blobPart = data instanceof Blob ? data : toArrayBuffer(data);
    const blob = new Blob([blobPart], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
};

export const App = () => {
    const compressInputRef = useRef<HTMLInputElement>(null);
    const splitInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState<ActiveTab>("compress");
    const [compressionLevel, setCompressionLevel] = useState(6);
    const [decodeLevel, setDecodeLevel] = useState<DecodeLevel>("generalized");
    const [isRecompressFlateEnabled, setIsRecompressFlateEnabled] = useState(true);
    const [isCompressPagesEnabled, setIsCompressPagesEnabled] = useState(false);
    const [isRemoveUnreferencedEnabled, setIsRemoveUnreferencedEnabled] = useState(false);
    const [compressionStats, setCompressionStats] = useState<CompressionStats | null>(null);
    const [compressStatus, setCompressStatus] = useState<StatusMessage | null>(null);
    const [splitStatus, setSplitStatus] = useState<StatusMessage | null>(null);
    const [splitFileName, setSplitFileName] = useState("document");
    const [splitPagesData, setSplitPagesData] = useState<SplitPage[]>([]);
    const [version, setVersion] = useState("Loading version...");

    useEffect(() => {
        let isMounted = true;

        getVersion()
            .then((qpdfVersion) => {
                if (isMounted) {
                    setVersion(`qpdf ${qpdfVersion}`);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setVersion("qpdf version unavailable");
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const handleCompressFile = async (file: File) => {
        if (!isPdfFile(file)) {
            setCompressStatus({ message: "Please select a PDF file", type: "error" });
            return;
        }

        setCompressStatus({ message: "Reading file...", type: "info" });

        try {
            const arrayBuffer = await file.arrayBuffer();
            const startTime = performance.now();
            const options: CompressionOptions = {
                compressionLevel,
                decodeLevel,
                recompressFlate: isRecompressFlateEnabled,
                compressPages: isCompressPagesEnabled,
                removeUnreferencedResources: isRemoveUnreferencedEnabled,
            };

            setCompressStatus({ message: "Compressing PDF...", type: "info" });

            const result = await compressPdf(arrayBuffer, options);
            const processingTime = ((performance.now() - startTime) / 1000).toFixed(2);
            const savingsPercent = ((result.savedBytes / result.originalSize) * 100).toFixed(1);

            setCompressionStats({
                compressedData: result.data,
                compressedSize: result.compressedSize,
                originalSize: result.originalSize,
                processingTime,
                savedBytes: result.savedBytes,
                savingsPercent,
            });
            setCompressStatus({ message: "Compression complete!", type: "success" });
        } catch (error) {
            setCompressStatus({ message: `Error: ${getErrorMessage(error)}`, type: "error" });
        }
    };

    const handleSplitFile = async (file: File) => {
        if (!isPdfFile(file)) {
            setSplitStatus({ message: "Please select a PDF file", type: "error" });
            return;
        }

        const baseName = file.name.replace(/\.pdf$/i, "") || "document";
        setSplitFileName(baseName);
        setSplitStatus({ message: "Splitting PDF...", type: "info" });

        try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await splitPages(arrayBuffer);
            const pages = result.pages.map((page: Uint8Array, index: number) => ({
                data: page,
                fileName: `${baseName}_page_${index + 1}.pdf`,
            }));
            const label = result.pageCount === 1 ? "page" : "pages";

            setSplitPagesData(pages);
            setSplitStatus({
                message: `Successfully split into ${result.pageCount} ${label}`,
                type: "success",
            });
        } catch (error) {
            setSplitStatus({ message: `Error: ${getErrorMessage(error)}`, type: "error" });
        }
    };

    const handleDrop = (event: DragEvent<HTMLButtonElement>, fileHandler: (file: File) => Promise<void>) => {
        event.preventDefault();
        const file = event.dataTransfer.files.item(0);

        if (file) {
            void fileHandler(file);
        }
    };

    const handleCompressInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.item(0);

        if (file) {
            void handleCompressFile(file);
        }
    };

    const handleSplitInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.item(0);

        if (file) {
            void handleSplitFile(file);
        }
    };

    const handleDownloadArchive = async () => {
        const zip = new JSZip();

        splitPagesData.forEach((page) => {
            zip.file(page.fileName, new Blob([toArrayBuffer(page.data)], { type: "application/pdf" }));
        });

        const zipContent = await zip.generateAsync({ type: "blob" });
        downloadData(zipContent, `${splitFileName}_pages.zip`, "application/zip");
    };

    return (
        <>
            <main className="container">
                <header className="hero">
                    <h1>Pdfly</h1>
                    <p>PDF tools powered by qpdf and WebAssembly</p>
                </header>

                <div className="tabs">
                    <button className={`tab-button ${activeTab === "compress" ? "active" : ""}`} type="button" onClick={() => setActiveTab("compress")}>
                        Compress
                    </button>
                    <button className={`tab-button ${activeTab === "split" ? "active" : ""}`} type="button" onClick={() => setActiveTab("split")}>
                        Split Pages
                    </button>
                </div>

                {activeTab === "compress" && (
                    <section className="tab-panel">
                        <button
                            className="upload-area"
                            type="button"
                            onClick={() => compressInputRef.current?.click()}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => handleDrop(event, handleCompressFile)}
                        >
                            <UploadIcon />
                            <span className="upload-title">Drop PDF here or click to upload</span>
                            <span className="upload-copy">Your file never leaves your browser</span>
                        </button>
                        <input ref={compressInputRef} className="visually-hidden" type="file" accept=".pdf,application/pdf" onChange={handleCompressInputChange} />

                        <div className="options">
                            <label className="option-group">
                                <span>
                                    Compression Level: <strong>{compressionLevel}</strong>
                                </span>
                                <input type="range" min="1" max="9" value={compressionLevel} onChange={(event) => setCompressionLevel(Number(event.target.value))} />
                                <small>1 = fastest, 9 = best compression</small>
                            </label>

                            <label className="option-group">
                                <span>Decode Level</span>
                                <select value={decodeLevel} onChange={(event) => setDecodeLevel(event.target.value as DecodeLevel)}>
                                    <option value="none">None - do not decode anything</option>
                                    <option value="generalized">Generalized - decode common filters</option>
                                    <option value="specialized">Specialized - decode JPEG and similar filters</option>
                                    <option value="all">All - maximum compression</option>
                                </select>
                            </label>

                            <div className="option-group">
                                <span>Advanced Options</span>
                                <label className="checkbox-label">
                                    <input type="checkbox" checked={isRecompressFlateEnabled} onChange={(event) => setIsRecompressFlateEnabled(event.target.checked)} />
                                    Recompress flate streams
                                </label>
                                <label className="checkbox-label">
                                    <input type="checkbox" checked={isCompressPagesEnabled} onChange={(event) => setIsCompressPagesEnabled(event.target.checked)} />
                                    Compress pages
                                </label>
                                <label className="checkbox-label">
                                    <input type="checkbox" checked={isRemoveUnreferencedEnabled} onChange={(event) => setIsRemoveUnreferencedEnabled(event.target.checked)} />
                                    Remove unreferenced resources
                                </label>
                            </div>
                        </div>

                        {compressStatus && <StatusNotice status={compressStatus} />}

                        {compressionStats && (
                            <div className="results">
                                <h2>Compression Results</h2>
                                <div className="savings">{compressionStats.savingsPercent}% saved</div>
                                <div className="stats">
                                    <Stat label="Original Size" value={formatBytes(compressionStats.originalSize)} />
                                    <Stat label="Compressed Size" value={formatBytes(compressionStats.compressedSize)} />
                                    <Stat label="Saved" value={formatBytes(compressionStats.savedBytes)} />
                                    <Stat label="Processing Time" value={`${compressionStats.processingTime}s`} />
                                </div>
                                <button className="button" type="button" onClick={() => downloadData(compressionStats.compressedData, "compressed.pdf")}>
                                    Download Compressed PDF
                                </button>
                            </div>
                        )}
                    </section>
                )}

                {activeTab === "split" && (
                    <section className="tab-panel">
                        <button
                            className="upload-area"
                            type="button"
                            onClick={() => splitInputRef.current?.click()}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => handleDrop(event, handleSplitFile)}
                        >
                            <UploadIcon />
                            <span className="upload-title">Drop PDF here or click to upload</span>
                            <span className="upload-copy">Each page will be extracted as a separate PDF</span>
                        </button>
                        <input ref={splitInputRef} className="visually-hidden" type="file" accept=".pdf,application/pdf" onChange={handleSplitInputChange} />

                        {splitStatus && <StatusNotice status={splitStatus} />}

                        {splitPagesData.length > 0 && (
                            <div className="split-results">
                                <div className="split-header">
                                    <h2>
                                        {splitPagesData.length} {splitPagesData.length === 1 ? "page" : "pages"} extracted
                                    </h2>
                                    <button className="button secondary" type="button" onClick={() => void handleDownloadArchive()}>
                                        Download All
                                    </button>
                                </div>
                                <div className="pages-list">
                                    {splitPagesData.map((page) => (
                                        <div className="page-item" key={page.fileName}>
                                            <div className="page-item-label">
                                                <span className="page-icon">PDF</span>
                                                <div>
                                                    <div className="page-name">{page.fileName}</div>
                                                    <div className="page-size">{formatBytes(page.data.byteLength)}</div>
                                                </div>
                                            </div>
                                            <button className="button secondary small" type="button" onClick={() => downloadData(page.data, page.fileName)}>
                                                Download
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>
                )}
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
};

const StatusNotice = ({ status }: { status: StatusMessage }) => <div className={`status ${status.type}`}>{status.message}</div>;

const Stat = ({ label, value }: { label: string; value: string }) => (
    <div className="stat">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
    </div>
);

const UploadIcon = () => (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 0 1-.88-7.903A5 5 0 0 1 15.9 6H16a5 5 0 0 1 1 9.9M15 13l-3-3m0 0-3 3m3-3v12" />
    </svg>
);
