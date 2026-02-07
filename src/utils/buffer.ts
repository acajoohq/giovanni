/**
 * Convert Uint8Array to Blob
 */
export function bufferToBlob(buffer: Uint8Array, type = 'application/pdf'): Blob {
  return new Blob([buffer], { type });
}

/**
 * Create a download URL from a Uint8Array
 */
export function createDownloadUrl(buffer: Uint8Array, type = 'application/pdf'): string {
  const blob = bufferToBlob(buffer, type);
  return URL.createObjectURL(blob);
}

/**
 * Trigger a download of a Uint8Array
 */
export function downloadBuffer(
  buffer: Uint8Array,
  filename: string,
  type = 'application/pdf'
): void {
  const url = createDownloadUrl(buffer, type);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
