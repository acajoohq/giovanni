export type GhostscriptPdfSettings = "screen" | "ebook" | "printer" | "prepress" | "default";

export type GhostscriptCompatibilityLevel = "1.3" | "1.4" | "1.5" | "1.6" | "1.7";

export type GhostscriptColorConversionStrategy = "LeaveColorUnchanged" | "Gray" | "RGB" | "CMYK" | "UseDeviceIndependentColor";

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
