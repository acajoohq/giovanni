export function copyPdfBytes(source: Uint8Array | ArrayBuffer): Uint8Array {
    if (source instanceof Uint8Array) {
        return new Uint8Array(source);
    }

    return new Uint8Array(source.slice(0));
}

export function copyPdfEntries(entries: Record<string, Uint8Array>): Record<string, Uint8Array> {
    return Object.fromEntries(Object.entries(entries).map(([name, data]) => [name, copyPdfBytes(data)]));
}
