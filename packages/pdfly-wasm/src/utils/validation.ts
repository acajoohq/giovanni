import { QpdfValidationError } from "../errors/index.js";

export function normalizeBuffer(input: Uint8Array | ArrayBuffer): Uint8Array {
    if (input instanceof Uint8Array) return input;
    if (input instanceof ArrayBuffer) return new Uint8Array(input);
    throw new QpdfValidationError("Input must be a Uint8Array or ArrayBuffer");
}
