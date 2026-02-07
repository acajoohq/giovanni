/**
 * Base error class for all qpdf-related errors
 */
export class QpdfError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'QpdfError';
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    // Fix prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error thrown when WASM module fails to initialize
 */
export class QpdfInitError extends QpdfError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'QpdfInitError';
  }
}

/**
 * Error thrown when PDF compression fails
 */
export class QpdfCompressionError extends QpdfError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'QpdfCompressionError';
  }
}

/**
 * Error thrown when input validation fails
 */
export class QpdfValidationError extends QpdfError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'QpdfValidationError';
  }
}
