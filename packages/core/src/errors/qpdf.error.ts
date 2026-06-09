/**
 * Base error class for all qpdf-related errors
 */
export type QpdfErrorCode = "init_failed" | "invalid_input" | "parse_failed" | "write_failed" | "operation_failed";

export interface QpdfErrorOptions extends ErrorOptions {
    code?: QpdfErrorCode;
    operation?: string;
}

export class QpdfError extends Error {
    readonly code: QpdfErrorCode;
    readonly operation?: string;

    constructor(message: string, options?: QpdfErrorOptions) {
        super(message, options);
        this.name = "QpdfError";
        this.code = options?.code ?? "operation_failed";
        this.operation = options?.operation;

        const errorWithCapture = Error as ErrorConstructor & {
            captureStackTrace?: (targetObject: object, constructorOpt?: Function) => void;
        };
        if (errorWithCapture.captureStackTrace) {
            errorWithCapture.captureStackTrace(this, this.constructor);
        }

        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export function isQpdfError(error: unknown): error is QpdfError {
    return error instanceof QpdfError;
}

export class QpdfInitError extends QpdfError {
    constructor(message: string, options?: QpdfErrorOptions) {
        super(message, options);
        this.name = "QpdfInitError";
    }
}

export class QpdfCompressionError extends QpdfError {
    constructor(message: string, options?: QpdfErrorOptions) {
        super(message, options);
        this.name = "QpdfCompressionError";
    }
}

export class QpdfSplitError extends QpdfError {
    constructor(message: string, options?: QpdfErrorOptions) {
        super(message, options);
        this.name = "QpdfSplitError";
    }
}

export class QpdfValidationError extends QpdfError {
    constructor(message: string, options?: QpdfErrorOptions) {
        super(message, options);
        this.name = "QpdfValidationError";
    }
}

export class QpdfMergeError extends QpdfError {
    constructor(message: string, options?: QpdfErrorOptions) {
        super(message, options);
        this.name = "QpdfMergeError";
    }
}

export class QpdfImageExtractionError extends QpdfError {
    constructor(message: string, options?: QpdfErrorOptions) {
        super(message, options);
        this.name = "QpdfImageExtractionError";
    }
}

export class QpdfConversionError extends QpdfError {
    constructor(message: string, options?: QpdfErrorOptions) {
        super(message, options);
        this.name = "QpdfConversionError";
    }
}

export class QpdfOrganizeError extends QpdfError {
    constructor(message: string, options?: QpdfErrorOptions) {
        super(message, options);
        this.name = "QpdfOrganizeError";
    }
}
