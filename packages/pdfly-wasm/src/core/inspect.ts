import { QpdfDocument } from "./qpdf.js";
import { QpdfError, QpdfValidationError } from "./errors.js";
import type { CheckOptions, InspectOptions, QpdfCheckResult, QpdfDocumentInfo } from "../types/index.js";

export async function inspectPdf(input: Uint8Array | ArrayBuffer, options?: InspectOptions): Promise<QpdfDocumentInfo> {
    const document = await QpdfDocument.open(input, options);

    try {
        return document.info();
    } finally {
        document.dispose();
    }
}

export async function checkPdf(input: Uint8Array | ArrayBuffer, options?: CheckOptions): Promise<QpdfCheckResult> {
    try {
        const info = await inspectPdf(input, options);

        return {
            info,
            isValid: true,
            warnings: [],
        };
    } catch (error) {
        if (error instanceof QpdfValidationError) {
            throw error;
        }
        if (error instanceof QpdfError) {
            return {
                info: {
                    numPages: 0,
                    pdfVersion: "",
                    isEncrypted: false,
                    isLinearized: false,
                },
                isValid: false,
                warnings: [error.message],
            };
        }
        throw error;
    }
}
