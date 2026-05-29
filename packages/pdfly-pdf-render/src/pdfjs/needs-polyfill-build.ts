type MapWithPolyfillMethods = Map<unknown, unknown> & {
    getOrInsertComputed?: (key: unknown, callback: () => unknown) => unknown;
};

/**
 * pdf.js modern build expects newer JS APIs (for example
 * `Map.prototype.getOrInsertComputed`). Mozilla ships a polyfilled build for
 * Safari, WKWebView, and other runtimes that lack them.
 */
export function needsPolyfillBuild(): boolean {
    if (typeof window === "undefined" && typeof globalThis.document === "undefined") {
        return false;
    }

    if (typeof Map === "undefined") {
        return true;
    }

    const mapPrototype = Map.prototype as MapWithPolyfillMethods;
    return typeof mapPrototype.getOrInsertComputed !== "function";
}
