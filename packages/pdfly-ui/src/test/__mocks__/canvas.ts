/**
 * Canvas mock replaces the native canvas addon for testing.
 * toBuffer size scales with quality so quality-comparison tests pass.
 */

export const createCanvas = (width: number, height: number) => {
    const makeContext = () => ({
        canvas: { width, height },
        save: () => {}, restore: () => {}, translate: () => {}, scale: () => {},
        rotate: () => {}, transform: () => {}, setTransform: () => {},
        drawImage: () => {}, fillRect: () => {}, clearRect: () => {},
        fillText: () => {}, strokeRect: () => {}, strokeText: () => {},
        beginPath: () => {}, moveTo: () => {}, lineTo: () => {}, closePath: () => {},
        stroke: () => {}, fill: () => {}, rect: () => {}, clip: () => {},
        arc: () => {}, arcTo: () => {}, bezierCurveTo: () => {}, quadraticCurveTo: () => {},
        createPattern: () => null,
        createLinearGradient: () => ({ addColorStop: () => {} }),
        createRadialGradient: () => ({ addColorStop: () => {} }),
        putImageData: () => {},
        getImageData: (sx: number, sy: number, sw: number, sh: number) => ({
            data: new Uint8ClampedArray(sw * sh * 4),
            width: sw,
            height: sh,
        }),
        createImageData: (sw: number, sh: number) => ({
            data: new Uint8ClampedArray(sw * sh * 4),
            width: sw,
            height: sh,
        }),
        measureText: () => ({ width: 0 }),
        isPointInPath: () => false,
        isPointInStroke: () => false,
    });

    return {
        width,
        height,
        getContext: (_type: string) => makeContext(),
        toBuffer: (_mime: string, opts?: { quality?: number }) => {
            const quality = opts?.quality ?? 0.92;
            // Size proportional to quality � quality-comparison tests rely on this.
            const size = Math.round(500 + 9500 * quality);
            const buf = Buffer.alloc(size);
            buf[0] = 0xff; buf[1] = 0xd8; buf[2] = 0xff; // JPEG magic bytes
            return buf;
        },
    };
};

export class Canvas {
    width: number;
    height: number;
    constructor(w: number, h: number) {
        this.width = w;
        this.height = h;
    }
}
