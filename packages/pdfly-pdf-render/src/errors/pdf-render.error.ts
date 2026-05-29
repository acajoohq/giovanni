export class PdfRenderError extends Error {
    declare readonly cause: unknown;

    constructor(message: string, options?: { cause?: unknown }) {
        super(message);
        this.name = "PdfRenderError";
        this.cause = options?.cause;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
