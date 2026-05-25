import { getQpdfBinding } from "../bindings/index.js";
import { QpdfError, QpdfInitError, QpdfValidationError } from "../errors/index.js";
import { toUint8Array } from "../utils/buffer.js";
import type { CheckOptions, InspectOptions, QpdfCheckResult, QpdfDocumentInfo } from "../types/index.js";

export async function inspectPdf(input: Uint8Array | ArrayBuffer, options?: InspectOptions): Promise<QpdfDocumentInfo> {
    const inputBuffer = toUint8Array(input);
    return getQpdfBinding().getDocumentInfo(inputBuffer, options?.password) as Promise<QpdfDocumentInfo>;
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
        if (error instanceof QpdfValidationError || error instanceof QpdfInitError) {
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
