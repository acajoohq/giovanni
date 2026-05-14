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

        // maintain proper stack traces in runtimes that expose captureStackTrace
        const errorWithCapture = Error as ErrorConstructor & {
            captureStackTrace?: (targetObject: object, constructorOpt?: Function) => void;
        };
        if (errorWithCapture.captureStackTrace) {
            errorWithCapture.captureStackTrace(this, this.constructor);
        }

        // fix prototype chain for instanceof checks
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export function isQpdfError(error: unknown): error is QpdfError {
    return error instanceof QpdfError;
}

export class QpdfInitError extends QpdfError {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = "QpdfInitError";
    }
}

export class QpdfCompressionError extends QpdfError {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = "QpdfCompressionError";
    }
}

export class QpdfSplitError extends QpdfError {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = "QpdfSplitError";
    }
}

export class QpdfValidationError extends QpdfError {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = "QpdfValidationError";
    }
}

export class QpdfMergeError extends QpdfError {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = "QpdfMergeError";
    }
}

export class QpdfImageExtractionError extends QpdfError {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = "QpdfImageExtractionError";
    }
}

export class QpdfConversionError extends QpdfError {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = "QpdfConversionError";
    }
}

export class QpdfOrganizeError extends QpdfError {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = "QpdfOrganizeError";
    }
}

export type GhostscriptErrorCode = "init_failed" | "invalid_input" | "parse_failed" | "write_failed" | "operation_failed";

export interface GhostscriptErrorOptions extends ErrorOptions {
    code?: GhostscriptErrorCode;
    operation?: string;
}

export class GhostscriptError extends Error {
    readonly code: GhostscriptErrorCode;
    readonly operation?: string;

    constructor(message: string, options?: GhostscriptErrorOptions) {
        super(message, options);
        this.name = "GhostscriptError";
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

export function isGhostscriptError(error: unknown): error is GhostscriptError {
    return error instanceof GhostscriptError;
}

export class GhostscriptInitError extends GhostscriptError {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = "GhostscriptInitError";
    }
}

export class GhostscriptCompressionError extends GhostscriptError {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = "GhostscriptCompressionError";
    }
}

export class GhostscriptValidationError extends GhostscriptError {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = "GhostscriptValidationError";
    }
}
