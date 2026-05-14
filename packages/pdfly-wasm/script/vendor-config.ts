import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type VendorName = "qpdf" | "ghostpdl";
export type BuildTarget = "qpdf" | "ghostscript";
export type BuildMode = "dev" | "prd";

export type VendorConfig = {
    displayName: string;
    directoryName: VendorName;
    version: string;
    archiveUrl: string;
    sha256?: string;
    detectVersion: (vendorRoot: string) => Promise<string | null>;
};

export const VENDOR_CONFIGS: Record<VendorName, VendorConfig> = {
    qpdf: {
        displayName: "qpdf",
        directoryName: "qpdf",
        version: "12.3.2",
        archiveUrl: "https://codeload.github.com/qpdf/qpdf/tar.gz/a898bb3a7289d1d05789d6d3f0d5dd534943a8da",
        detectVersion: detectQpdfVersion,
    },
    ghostpdl: {
        displayName: "GhostPDL",
        directoryName: "ghostpdl",
        version: "10.07.0",
        archiveUrl: "https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/download/gs10070/ghostpdl-10.07.0.tar.gz",
        sha256: "93dc72ee259374f0b576fb926bbe3648504020c75638c302bd144f94f1641ae2",
        detectVersion: detectGhostpdlVersion,
    },
};

export const BUILD_TARGETS: Record<BuildTarget, { vendor: VendorName; dockerfile: string; outputDirectory: string; dockerBuildArg: string }> = {
    qpdf: {
        vendor: "qpdf",
        dockerfile: "wasm/docker/qpdf.Dockerfile",
        outputDirectory: "build/wasm",
        dockerBuildArg: "QPDF_BUILD_MODE",
    },
    ghostscript: {
        vendor: "ghostpdl",
        dockerfile: "wasm/docker/ghostscript.Dockerfile",
        outputDirectory: "build/ghostscript",
        dockerBuildArg: "GHOSTSCRIPT_BUILD_MODE",
    },
};

async function detectQpdfVersion(vendorRoot: string): Promise<string | null> {
    const cmakeListsPath = join(vendorRoot, "CMakeLists.txt");
    const contents = await safeReadFile(cmakeListsPath);
    if (!contents) {
        return null;
    }

    const match = contents.match(/project\(qpdf\s+VERSION\s+([0-9]+\.[0-9]+\.[0-9]+)/m);
    return match?.[1] ?? null;
}

async function detectGhostpdlVersion(vendorRoot: string): Promise<string | null> {
    const versionMakPath = join(vendorRoot, "base", "version.mak");
    const contents = await safeReadFile(versionMakPath);
    if (!contents) {
        return null;
    }

    const major = contents.match(/^GS_VERSION_MAJOR=(\d+)$/m)?.[1];
    const minor = contents.match(/^GS_VERSION_MINOR=(\d+)$/m)?.[1];
    const patch = contents.match(/^GS_VERSION_PATCH=(\d+)$/m)?.[1];

    if (!major || !minor || !patch) {
        return null;
    }

    return `${major}.${minor}.${patch}`;
}

async function safeReadFile(path: string): Promise<string | null> {
    try {
        return await readFile(path, "utf8");
    } catch {
        return null;
    }
}
