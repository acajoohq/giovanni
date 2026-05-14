/**
 * PDF input accepted by qpdf-backed APIs.
 */
export type PdfInput = Uint8Array | ArrayBuffer;

export type CompressionEngine = "qpdf" | "ghostscript";

/**
 * Compression decode level - controls how aggressively to decode streams
 */
export type DecodeLevel = "none" | "generalized" | "specialized" | "all";

/**
 * Object stream mode - controls how objects are stored in the PDF
 */
export type ObjectStreamMode = "preserve" | "disable" | "generate";

/**
 * Preset for qpdf's lossless writer pipeline.
 */
export type QpdfOptimizePreset = "default" | "web" | "archive";

export type GhostscriptPdfSettings = "screen" | "ebook" | "printer" | "prepress" | "default";

export type GhostscriptCompatibilityLevel = "1.3" | "1.4" | "1.5" | "1.6" | "1.7";

export type GhostscriptColorConversionStrategy = "LeaveColorUnchanged" | "Gray" | "RGB" | "CMYK" | "UseDeviceIndependentColor";

/**
 * Shared qpdf writer options.
 */
export interface WriteOptions {
    /**
     * Whether to produce a linearized PDF for byte-range web delivery.
     * @default false
     */
    linearize?: boolean;

    /**
     * Compression level (1-9)
     * 1 = fastest, least compression
     * 9 = slowest, best compression
     * @default 6
     */
    compressionLevel?: number;

    /**
     * Decode level - controls how aggressively to decode and recompress streams
     * - 'none': Don't decode anything
     * - 'generalized': Decode generalized filters (predictors, etc.)
     * - 'specialized': Decode specialized filters (JPEG, etc.)
     * - 'all': Decode everything possible
     * @default 'generalized'
     */
    decodeLevel?: DecodeLevel;

    /**
     * Whether to recompress streams that are already compressed with flate
     * @default true
     */
    recompressFlate?: boolean;

    /**
     * Object stream mode - controls how objects are stored
     * - 'preserve': Keep existing object streams
     * - 'disable': Disable object streams
     * - 'generate': Generate object streams for better compression
     * @default 'generate' prefer `'preserve'` when output must mirror input structure
     */
    objectStreams?: ObjectStreamMode;

    /**
     * Whether to compress pages (combine multiple content streams)
     * @default false
     */
    compressPages?: boolean;

    /**
     * Whether to remove unreferenced resources
     * @default false
     */
    removeUnreferencedResources?: boolean;
}

/**
 * Options for PDF optimization.
 */
export interface OptimizeOptions extends WriteOptions {
    /**
     * Named lossless optimization preset.
     * @default "default"
     */
    preset?: QpdfOptimizePreset;
}

export interface GhostscriptCompressOptions {
    /**
     * Named Ghostscript quality preset.
     * Alias for pdfSettings.
     * @default "default"
     */
    preset?: GhostscriptPdfSettings;

    /**
     * Ghostscript PDFSETTINGS preset.
     * @default "default"
     */
    pdfSettings?: GhostscriptPdfSettings;

    /**
     * Output PDF compatibility level.
     */
    compatibilityLevel?: GhostscriptCompatibilityLevel;

    /**
     * Ghostscript color conversion strategy.
     */
    colorConversionStrategy?: GhostscriptColorConversionStrategy;

    /**
     * Downsample color images.
     */
    downsampleColorImages?: boolean;

    /**
     * Downsample grayscale images.
     */
    downsampleGrayImages?: boolean;

    /**
     * Downsample monochrome images.
     */
    downsampleMonoImages?: boolean;

    /**
     * Target resolution for color images.
     */
    colorImageResolution?: number;

    /**
     * Target resolution for grayscale images.
     */
    grayImageResolution?: number;

    /**
     * Target resolution for monochrome images.
     */
    monoImageResolution?: number;

    /**
     * JPEG quality for image recompression.
     * Integer in [0, 100].
     */
    jpegQuality?: number;
}

export type CompressOptions = ({ engine?: "qpdf" } & OptimizeOptions) | ({ engine: "ghostscript" } & GhostscriptCompressOptions);

/**
 * Options for opening an encrypted PDF.
 */
export interface OpenDocumentOptions {
    /**
     * Password for encrypted PDFs.
     */
    password?: string;
}

/**
 * Options for splitting a PDF.
 */
export interface SplitOptions extends OpenDocumentOptions {}

/**
 * Options for merging PDFs.
 */
export interface MergeOptions extends WriteOptions {}

/**
 * Options for organizing pages.
 */
export interface OrganizeOptions extends OpenDocumentOptions {
    /**
     * Zero-based page indices for the output PDF.
     * Duplicates copy pages; omitted indices remove pages.
     */
    pages: number[];
}

/**
 * Options for inspecting a PDF.
 */
export interface InspectOptions extends OpenDocumentOptions {}

/**
 * Options for checking a PDF.
 */
export interface CheckOptions extends OpenDocumentOptions {}

/**
 * Options for rendering PDF pages to JPG.
 */
export interface RenderPdfPagesToJpgOptions {
    /**
     * JPEG quality (0-1], where 1 is best quality)
     * @default 0.92
     */
    quality?: number;

    /**
     * Rendering scale multiplier for PDF page rasterisation.
     * Higher values produce sharper images at the cost of larger file sizes.
     * @default 2.0
     */
    scale?: number;
}
