import { loadPdfjsLegacy } from "./legacy.js";
import { needsPolyfillBuild } from "./needs-polyfill-build.js";
import type { PdfjsModule } from "./pdfjs-module.types.js";
import { loadPdfjsStandard } from "./standard.js";

let pdfjsPromise: Promise<PdfjsModule> | null = null;

export type { PdfjsModule };

export async function loadPdfjs(): Promise<PdfjsModule> {
    if (needsPolyfillBuild()) {
        return loadPdfjsLegacy();
    }

    return loadPdfjsStandard();
}

export function getPdfjs(): Promise<PdfjsModule> {
    if (!pdfjsPromise) {
        pdfjsPromise = loadPdfjs();
    }

    return pdfjsPromise;
}
