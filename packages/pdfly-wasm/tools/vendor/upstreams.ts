export type VendorName = "qpdf" | "ghostscript";

export type VendorPin = {
    displayName: string;
    directoryName: VendorName;
    version: string;
    archiveUrl: string;
    sha256?: string;
};

export const VENDOR_PINS: Record<VendorName, VendorPin> = {
    qpdf: {
        displayName: "qpdf",
        directoryName: "qpdf",
        version: "12.3.2",
        archiveUrl: "https://codeload.github.com/qpdf/qpdf/tar.gz/a898bb3a7289d1d05789d6d3f0d5dd534943a8da",
    },
    ghostscript: {
        displayName: "GhostPDL",
        directoryName: "ghostpdl",
        version: "10.07.0",
        archiveUrl: "https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/download/gs10070/ghostpdl-10.07.0.tar.gz",
        sha256: "93dc72ee259374f0b576fb926bbe3648504020c75638c302bd144f94f1641ae2",
    },
};

export const VENDOR_NAMES = Object.keys(VENDOR_PINS) as VendorName[];

export function isVendorName(value: string): value is VendorName {
    return value in VENDOR_PINS;
}
