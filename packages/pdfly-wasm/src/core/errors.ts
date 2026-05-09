/**
 * Base error class for all qpdf-related errors
 */
export class QpdfError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = "QpdfError";

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

/**
 * Error thrown when WASM module fails to initialize
 */
export class QpdfInitError extends QpdfError {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = "QpdfInitError";
    }
}

/**
 * Error thrown when PDF compression fails
 */
export class QpdfCompressionError extends QpdfError {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = "QpdfCompressionError";
    }
}

/**
 * Error thrown when PDF splitting fails
 */
export class QpdfSplitError extends QpdfError {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = "QpdfSplitError";
    }
}

/**
 * Error thrown when input validation fails
 */
export class QpdfValidationError extends QpdfError {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = "QpdfValidationError";
    }
}

/**
 * Error thrown when PDF merging fails
 */
export class QpdfMergeError extends QpdfError {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = "QpdfMergeError";
    }
}

/**
 * Error thrown when image extraction fails
 */
export class QpdfImageExtractionError extends QpdfError {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = "QpdfImageExtractionError";
    }
}

/**
 * Error thrown when PDF to JPG conversion fails
 */
export class QpdfConversionError extends QpdfError {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = "QpdfConversionError";
    }
}

/**
 * Error thrown when PDF page reorganization fails
 */
export class QpdfOrganizeError extends QpdfError {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = "QpdfOrganizeError";
    }
}
