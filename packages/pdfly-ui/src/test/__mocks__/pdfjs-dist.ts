/**
 * pdfjs-dist mock – avoids browser-globals (DOMMatrix, Worker) in Node test env.
 * Pages use standard US-letter dimensions (612 x 792 pt) scaled by the `scale` option.
 */

const BASE_W = 612;
const BASE_H = 792;

export const getDocument = (_params: unknown) => ({
    promise: Promise.resolve({
        numPages: 1,
        getPage: (_n: number) =>
            Promise.resolve({
                getViewport: ({ scale }: { scale: number }) => ({
                    width: BASE_W * scale,
                    height: BASE_H * scale,
                }),
                render: (_params: unknown) => ({ promise: Promise.resolve() }),
                cleanup: () => {},
            }),
        destroy: () => Promise.resolve(),
    }),
});

export const GlobalWorkerOptions: { workerSrc: string } = { workerSrc: "" };