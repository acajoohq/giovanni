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
