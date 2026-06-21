import type { getDocument } from "pdfjs-dist/types/src/display/api.js";

export type PdfjsModule = {
    getDocument: typeof getDocument;
    GlobalWorkerOptions: {
        workerSrc: string;
    };
};
