import * as FileSystem from "expo-file-system/legacy";

const SCANS_ROOT = `${FileSystem.documentDirectory ?? ""}scans/`;

export function getScanDirectory(scanId: string): string {
    return `${SCANS_ROOT}${scanId}/`;
}

export async function ensureScanDirectory(scanId: string): Promise<string> {
    const rootInfo = await FileSystem.getInfoAsync(SCANS_ROOT);
    if (!rootInfo.exists) {
        await FileSystem.makeDirectoryAsync(SCANS_ROOT, { intermediates: true });
    }

    const scanDirectory = getScanDirectory(scanId);
    const scanInfo = await FileSystem.getInfoAsync(scanDirectory);
    if (!scanInfo.exists) {
        await FileSystem.makeDirectoryAsync(scanDirectory, { intermediates: true });
    }

    return scanDirectory;
}

export async function copyOriginalImage(sourceUri: string, scanId: string): Promise<string> {
    const scanDirectory = await ensureScanDirectory(scanId);
    const originalUri = `${scanDirectory}original.jpg`;

    await FileSystem.copyAsync({ from: sourceUri, to: originalUri });
    return originalUri;
}

export async function copyFallbackRectifiedImage(originalUri: string, scanId: string): Promise<string> {
    const scanDirectory = await ensureScanDirectory(scanId);
    const rectifiedUri = `${scanDirectory}rectified.jpg`;

    await FileSystem.copyAsync({ from: originalUri, to: rectifiedUri });
    return rectifiedUri;
}

export function getRectifiedImageUri(scanId: string): string {
    return `${getScanDirectory(scanId)}rectified.jpg`;
}
