import { describe, it, expect, vi, beforeEach } from "vitest";
import { QpdfError, QpdfValidationError } from "../errors/index.js";
import { inspectPdf, checkPdf } from "./inspect.js";
import { QpdfDocument } from "../engines/qpdf/document.js";

vi.mock("../engines/qpdf/document.js", () => ({
    QpdfDocument: { open: vi.fn<() => Promise<never>>() },
}));

const mockOpen = vi.mocked(QpdfDocument.open);

function makeDefaultInfo() {
    return {
        numPages: 3,
        pdfVersion: "1.7",
        isEncrypted: false,
        isLinearized: false,
    };
}

function makeDocumentInstance(infoResult = makeDefaultInfo()) {
    return {
        info: vi.fn<() => typeof infoResult>().mockReturnValue(infoResult),
        dispose: vi.fn<() => void>(),
    };
}

beforeEach(() => {
    vi.resetAllMocks();
});

describe("inspectPdf", () => {
    it("returns document info", async () => {
        const fakeDoc = makeDocumentInstance();
        mockOpen.mockResolvedValue(fakeDoc as never);

        const result = await inspectPdf(new Uint8Array());

        expect(result).toEqual(makeDefaultInfo());
    });

    it("disposes the document after a successful read", async () => {
        const fakeDoc = makeDocumentInstance();
        mockOpen.mockResolvedValue(fakeDoc as never);

        await inspectPdf(new Uint8Array());

        expect(fakeDoc.dispose).toHaveBeenCalledOnce();
    });

    it("disposes the document even when info() throws", async () => {
        const fakeDoc = makeDocumentInstance();
        fakeDoc.info.mockImplementation(() => {
            throw new Error("metadata parse error");
        });
        mockOpen.mockResolvedValue(fakeDoc as never);

        await expect(inspectPdf(new Uint8Array())).rejects.toThrow("metadata parse error");

        expect(fakeDoc.dispose).toHaveBeenCalledOnce();
    });
});

describe("checkPdf", () => {
    it("returns isValid: true and empty warnings on success", async () => {
        const fakeDoc = makeDocumentInstance();
        mockOpen.mockResolvedValue(fakeDoc as never);

        const result = await checkPdf(new Uint8Array());

        expect(result.isValid).toBe(true);
        expect(result.warnings).toHaveLength(0);
        expect(result.info).toEqual(makeDefaultInfo());
    });

    it("returns isValid: false with the error message in warnings when a QpdfError is thrown", async () => {
        mockOpen.mockRejectedValue(new QpdfError("corrupted PDF structure"));

        const result = await checkPdf(new Uint8Array());

        expect(result.isValid).toBe(false);
        expect(result.warnings).toContain("corrupted PDF structure");
    });

    it("returns a zeroed info when the PDF is invalid", async () => {
        mockOpen.mockRejectedValue(new QpdfError("unreadable"));

        const result = await checkPdf(new Uint8Array());

        expect(result.info.numPages).toBe(0);
        expect(result.info.pdfVersion).toBe("");
    });

    it("rethrows QpdfValidationError unchanged", async () => {
        const validationError = new QpdfValidationError("bad input type");
        mockOpen.mockRejectedValue(validationError);

        await expect(checkPdf(new Uint8Array())).rejects.toBe(validationError);
    });

    it("rethrows non-QpdfError errors unchanged", async () => {
        const unexpected = new TypeError("something unexpected");
        mockOpen.mockRejectedValue(unexpected);

        await expect(checkPdf(new Uint8Array())).rejects.toBe(unexpected);
    });
});
