export function toUint8Array(input: Uint8Array | ArrayBuffer): Uint8Array {
    if (input instanceof Uint8Array) return input;
    if (input instanceof ArrayBuffer) return new Uint8Array(input);
    throw new TypeError("Input must be a Uint8Array or ArrayBuffer");
}
