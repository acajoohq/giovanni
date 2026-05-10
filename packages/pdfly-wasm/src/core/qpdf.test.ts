import { describe, it, expect, vi, beforeEach } from "vitest";
import { QpdfValidationError, QpdfCompressionError } from "./errors.js";
import { QpdfDocument } from "./qpdf.js";
import { initQpdfModule } from "./module-loader.js";

vi.mock("./module-loader.js");

const mockInitQpdfModule = vi.mocked(initQpdfModule);

type FakeWrapper = {
    processMemoryFile: ReturnType<typeof vi.fn<() => void>>;
    getNumPages: ReturnType<typeof vi.fn<() => number>>;
    getPDFVersion: ReturnType<typeof vi.fn<() => string>>;
    isEncrypted: ReturnType<typeof vi.fn<() => boolean>>;
    isLinearized: ReturnType<typeof vi.fn<() => boolean>>;
    coalesceContentStreams: ReturnType<typeof vi.fn<() => void>>;
    removeUnreferencedResources: ReturnType<typeof vi.fn<() => void>>;
    delete: ReturnType<typeof vi.fn<() => void>>;
};

type FakeWriter = {
    setCompressStreams: ReturnType<typeof vi.fn<() => void>>;
    setCompressionLevel: ReturnType<typeof vi.fn<() => void>>;
    setDecodeLevel: ReturnType<typeof vi.fn<() => void>>;
    setRecompressFlate: ReturnType<typeof vi.fn<() => void>>;
    setObjectStreamMode: ReturnType<typeof vi.fn<() => void>>;
    write: ReturnType<typeof vi.fn<() => void>>;
    getBuffer: ReturnType<typeof vi.fn<() => Uint8Array>>;
    delete: ReturnType<typeof vi.fn<() => void>>;
};

function makeFakeWrapper(): FakeWrapper {
    return {
        processMemoryFile: vi.fn<() => void>(),
        getNumPages: vi.fn<() => number>().mockReturnValue(5),
        getPDFVersion: vi.fn<() => string>().mockReturnValue("1.7"),
        isEncrypted: vi.fn<() => boolean>().mockReturnValue(false),
        isLinearized: vi.fn<() => boolean>().mockReturnValue(true),
        coalesceContentStreams: vi.fn<() => void>(),
        removeUnreferencedResources: vi.fn<() => void>(),
        delete: vi.fn<() => void>(),
    };
}

function makeFakeWriter(buffer = new Uint8Array([0x25, 0x50, 0x44, 0x46])): FakeWriter {
    return {
        setCompressStreams: vi.fn<() => void>(),
        setCompressionLevel: vi.fn<() => void>(),
        setDecodeLevel: vi.fn<() => void>(),
        setRecompressFlate: vi.fn<() => void>(),
        setObjectStreamMode: vi.fn<() => void>(),
        write: vi.fn<() => void>(),
        getBuffer: vi.fn<() => Uint8Array>().mockReturnValue(buffer),
        delete: vi.fn<() => void>(),
    };
}

function makeFakeModule(wrapper = makeFakeWrapper(), writer = makeFakeWriter()) {
    return {
        // must be regular functions (not arrows) — qpdf.ts calls them with `new`
        QPDFWrapper: vi.fn<() => FakeWrapper>().mockImplementation(function () {
            return wrapper;
        }),
        QPDFWriter: vi.fn<() => FakeWriter>().mockImplementation(function () {
            return writer;
        }),
        compressPdf: () => new Uint8Array(),
        splitPages: () => [] as Uint8Array[],
        mergePdfs: () => new Uint8Array(),
        extractImages: () => [],
        getVersion: () => "11.0.0",
    };
}

beforeEach(() => {
    vi.resetAllMocks();
});

describe("QpdfDocument", () => {
    describe("QpdfDocument.open() static factory", () => {
        it("returns a QpdfDocument instance", async () => {
            mockInitQpdfModule.mockResolvedValue(makeFakeModule() as never);

            const doc = await QpdfDocument.open(new Uint8Array());

            expect(doc).toBeInstanceOf(QpdfDocument);
            doc.dispose();
        });

        it("passes password to processMemoryFile", async () => {
            const wrapper = makeFakeWrapper();
            mockInitQpdfModule.mockResolvedValue(makeFakeModule(wrapper) as never);

            const doc = await QpdfDocument.open(new Uint8Array(), { password: "secret" });

            expect(wrapper.processMemoryFile).toHaveBeenCalledWith(expect.any(Uint8Array), "secret");
            doc.dispose();
        });

        it("passes empty string when no password is given", async () => {
            const wrapper = makeFakeWrapper();
            mockInitQpdfModule.mockResolvedValue(makeFakeModule(wrapper) as never);

            const doc = await QpdfDocument.open(new Uint8Array());

            expect(wrapper.processMemoryFile).toHaveBeenCalledWith(expect.any(Uint8Array), "");
            doc.dispose();
        });
    });

    describe("instance.open() disposes previous instance", () => {
        it("calls delete() on the previous wrapper before replacing it", async () => {
            const firstWrapper = makeFakeWrapper();
            const secondWrapper = makeFakeWrapper();
            const mod = makeFakeModule();
            mod.QPDFWrapper.mockImplementationOnce(function () {
                return firstWrapper;
            }).mockImplementationOnce(function () {
                return secondWrapper;
            });
            mockInitQpdfModule.mockResolvedValue(mod as never);

            const doc = new QpdfDocument();
            await doc.open(new Uint8Array());
            await doc.open(new Uint8Array());

            expect(firstWrapper.delete).toHaveBeenCalledOnce();
            doc.dispose();
        });
    });

    describe("property getters", () => {
        it("pageCount delegates to getNumPages()", async () => {
            const wrapper = makeFakeWrapper();
            wrapper.getNumPages.mockReturnValue(7);
            mockInitQpdfModule.mockResolvedValue(makeFakeModule(wrapper) as never);

            const doc = await QpdfDocument.open(new Uint8Array());

            expect(doc.pageCount).toBe(7);
            doc.dispose();
        });

        it("pdfVersion delegates to getPDFVersion()", async () => {
            const wrapper = makeFakeWrapper();
            wrapper.getPDFVersion.mockReturnValue("2.0");
            mockInitQpdfModule.mockResolvedValue(makeFakeModule(wrapper) as never);

            const doc = await QpdfDocument.open(new Uint8Array());

            expect(doc.pdfVersion).toBe("2.0");
            doc.dispose();
        });

        it("isEncrypted delegates to isEncrypted()", async () => {
            const wrapper = makeFakeWrapper();
            wrapper.isEncrypted.mockReturnValue(true);
            mockInitQpdfModule.mockResolvedValue(makeFakeModule(wrapper) as never);

            const doc = await QpdfDocument.open(new Uint8Array());

            expect(doc.isEncrypted).toBe(true);
            doc.dispose();
        });

        it("isLinearized delegates to isLinearized()", async () => {
            const wrapper = makeFakeWrapper();
            wrapper.isLinearized.mockReturnValue(false);
            mockInitQpdfModule.mockResolvedValue(makeFakeModule(wrapper) as never);

            const doc = await QpdfDocument.open(new Uint8Array());

            expect(doc.isLinearized).toBe(false);
            doc.dispose();
        });

        it("throws QpdfValidationError when the document is not open", () => {
            const doc = new QpdfDocument();

            expect(() => doc.pageCount).toThrow(QpdfValidationError);
            expect(() => doc.pdfVersion).toThrow(QpdfValidationError);
            expect(() => doc.isEncrypted).toThrow(QpdfValidationError);
            expect(() => doc.isLinearized).toThrow(QpdfValidationError);
        });
    });

    describe("info()", () => {
        it("aggregates all document metadata", async () => {
            const wrapper = makeFakeWrapper();
            wrapper.getNumPages.mockReturnValue(3);
            wrapper.getPDFVersion.mockReturnValue("1.4");
            wrapper.isEncrypted.mockReturnValue(false);
            wrapper.isLinearized.mockReturnValue(true);
            mockInitQpdfModule.mockResolvedValue(makeFakeModule(wrapper) as never);

            const doc = await QpdfDocument.open(new Uint8Array());
            const info = doc.info();

            expect(info).toMatchObject({ numPages: 3, pdfVersion: "1.4", isEncrypted: false, isLinearized: true });
            doc.dispose();
        });
    });

    describe("write()", () => {
        it("returns a Uint8Array from writer.getBuffer()", async () => {
            const wasmBuffer = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
            const writer = makeFakeWriter(wasmBuffer);
            mockInitQpdfModule.mockResolvedValue(makeFakeModule(makeFakeWrapper(), writer) as never);

            const doc = await QpdfDocument.open(new Uint8Array());
            const result = await doc.write();

            expect(result).toBeInstanceOf(Uint8Array);
            expect(writer.write).toHaveBeenCalled();
            expect(writer.getBuffer).toHaveBeenCalled();
            doc.dispose();
        });

        it("calls writer.delete() even when write() throws", async () => {
            const writer = makeFakeWriter();
            writer.write.mockImplementation(() => {
                throw new Error("write error");
            });
            mockInitQpdfModule.mockResolvedValue(makeFakeModule(makeFakeWrapper(), writer) as never);

            const doc = await QpdfDocument.open(new Uint8Array());
            await expect(doc.write()).rejects.toThrow("Failed to write PDF");

            expect(writer.delete).toHaveBeenCalled();
            doc.dispose();
        });

        it("wraps write failures in QpdfCompressionError", async () => {
            const writer = makeFakeWriter();
            writer.write.mockImplementation(() => {
                throw new Error("internal qpdf error");
            });
            mockInitQpdfModule.mockResolvedValue(makeFakeModule(makeFakeWrapper(), writer) as never);

            const doc = await QpdfDocument.open(new Uint8Array());

            await expect(doc.write()).rejects.toBeInstanceOf(QpdfCompressionError);
            doc.dispose();
        });

        it("calls coalesceContentStreams() when compressPages is true", async () => {
            const wrapper = makeFakeWrapper();
            mockInitQpdfModule.mockResolvedValue(makeFakeModule(wrapper) as never);

            const doc = await QpdfDocument.open(new Uint8Array());
            await doc.write({ compressPages: true });

            expect(wrapper.coalesceContentStreams).toHaveBeenCalledOnce();
            doc.dispose();
        });

        it("does not call coalesceContentStreams() when compressPages is false", async () => {
            const wrapper = makeFakeWrapper();
            mockInitQpdfModule.mockResolvedValue(makeFakeModule(wrapper) as never);

            const doc = await QpdfDocument.open(new Uint8Array());
            await doc.write({ compressPages: false });

            expect(wrapper.coalesceContentStreams).not.toHaveBeenCalled();
            doc.dispose();
        });

        it("calls removeUnreferencedResources() when removeUnreferencedResources is true", async () => {
            const wrapper = makeFakeWrapper();
            mockInitQpdfModule.mockResolvedValue(makeFakeModule(wrapper) as never);

            const doc = await QpdfDocument.open(new Uint8Array());
            await doc.write({ removeUnreferencedResources: true });

            expect(wrapper.removeUnreferencedResources).toHaveBeenCalledOnce();
            doc.dispose();
        });

        it("does not call removeUnreferencedResources() when removeUnreferencedResources is false", async () => {
            const wrapper = makeFakeWrapper();
            mockInitQpdfModule.mockResolvedValue(makeFakeModule(wrapper) as never);

            const doc = await QpdfDocument.open(new Uint8Array());
            await doc.write({ removeUnreferencedResources: false });

            expect(wrapper.removeUnreferencedResources).not.toHaveBeenCalled();
            doc.dispose();
        });

        it("calls both coalesceContentStreams() and removeUnreferencedResources() for archive preset options", async () => {
            const wrapper = makeFakeWrapper();
            mockInitQpdfModule.mockResolvedValue(makeFakeModule(wrapper) as never);

            const doc = await QpdfDocument.open(new Uint8Array());
            await doc.write({ compressPages: true, removeUnreferencedResources: true });

            expect(wrapper.coalesceContentStreams).toHaveBeenCalledOnce();
            expect(wrapper.removeUnreferencedResources).toHaveBeenCalledOnce();
            doc.dispose();
        });

        it("calls coalesceContentStreams() before constructing the writer", async () => {
            const wrapper = makeFakeWrapper();
            const callOrder: string[] = [];
            wrapper.coalesceContentStreams.mockImplementation(() => { callOrder.push("coalesce"); });
            const mod = makeFakeModule(wrapper);
            const originalWriterCtor = mod.QPDFWriter;
            mod.QPDFWriter = vi.fn<() => FakeWriter>().mockImplementation(function (...args) {
                callOrder.push("writerCtor");
                return originalWriterCtor(...args);
            });
            mockInitQpdfModule.mockResolvedValue(mod as never);

            const doc = await QpdfDocument.open(new Uint8Array());
            await doc.write({ compressPages: true });

            expect(callOrder).toEqual(["coalesce", "writerCtor"]);
            doc.dispose();
        });

        it("throws QpdfValidationError when the document is not open", async () => {
            const doc = new QpdfDocument();

            await expect(doc.write()).rejects.toBeInstanceOf(QpdfValidationError);
        });
    });

    describe("dispose()", () => {
        it("is idempotent — safe to call multiple times", async () => {
            const wrapper = makeFakeWrapper();
            mockInitQpdfModule.mockResolvedValue(makeFakeModule(wrapper) as never);

            const doc = await QpdfDocument.open(new Uint8Array());
            doc.dispose();
            doc.dispose();

            expect(wrapper.delete).toHaveBeenCalledOnce();
        });
    });
});
