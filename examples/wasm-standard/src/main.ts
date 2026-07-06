import "./style.css";
import {
    calculateSavings,
    checkPdf,
    compressPdf,
    extractImages,
    formatBytes,
    formatPercentage,
    getAvailableCompressionEngines,
    getGhostscriptBinding,
    getQpdfBinding,
    GhostscriptValidationError,
    initCompressionEngine,
    inspectPdf,
    isGhostscriptError,
    isQpdfError,
    mergePdfs,
    organizePdf,
    QpdfError,
    resetGhostscriptBinding,
    resetQpdfBinding,
    setGhostscriptBinding,
    setQpdfBinding,
    splitPdf,
} from "@acajoo/giovanni-core";
import { compressPdfWithGhostscript, getGhostscriptVersion, GHOSTSCRIPT_PRESETS, initGhostscript, rewritePdfWithGhostscript } from "@acajoo/giovanni-core/ghostscript";
import { compressPdfWithQpdf, getQpdfVersion, initQpdf, linearizePdf, optimizePdf, QPDF_PRESETS, QpdfDocument } from "@acajoo/giovanni-core/qpdf";

interface Step {
    name: string;
    run: () => Promise<string> | string;
}

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message);
}

function isPdf(bytes: Uint8Array): boolean {
    return new TextDecoder("ascii").decode(bytes.subarray(0, 5)) === "%PDF-";
}

const resultsEl = document.querySelector<HTMLOListElement>("#results");
const summaryEl = document.querySelector<HTMLParagraphElement>("#summary");

async function runStep(step: Step): Promise<boolean> {
    const li = document.createElement("li");
    li.className = "pending";
    li.textContent = `${step.name}…`;
    resultsEl?.appendChild(li);

    const start = performance.now();
    try {
        const detail = await step.run();
        const ms = Math.round(performance.now() - start);
        li.className = "pass";
        li.textContent = `${step.name} (${ms}ms) — ${detail}`;
        return true;
    } catch (error) {
        const ms = Math.round(performance.now() - start);
        const message = error instanceof Error ? error.message : String(error);
        li.className = "fail";
        li.textContent = `${step.name} (${ms}ms) — ${message}`;
        console.error(step.name, error);
        return false;
    }
}

async function main(): Promise<void> {
    const sampleBuffer: ArrayBuffer = await fetch("/sample.pdf").then((response) => response.arrayBuffer());
    const sample = new Uint8Array(sampleBuffer);

    let pageCount = 0;
    let splitPages: Uint8Array[] = [];

    const steps: Step[] = [
        {
            name: "getAvailableCompressionEngines",
            run: () => {
                const engines = getAvailableCompressionEngines();
                assert(engines.includes("qpdf") && engines.includes("ghostscript"), `unexpected engines: ${engines.join(", ")}`);
                return engines.join(", ");
            },
        },
        {
            name: "initQpdf",
            run: async () => {
                await initQpdf();
                return "initialized";
            },
        },
        {
            name: "getQpdfVersion",
            run: async () => {
                const version = await getQpdfVersion();
                assert(version.length > 0, "empty version string");
                return version;
            },
        },
        {
            name: "initGhostscript",
            run: async () => {
                await initGhostscript();
                return "initialized";
            },
        },
        {
            name: "getGhostscriptVersion",
            run: async () => {
                const version = await getGhostscriptVersion();
                assert(version.length > 0, "empty version string");
                return version;
            },
        },
        {
            name: "initCompressionEngine(qpdf)",
            run: async () => {
                await initCompressionEngine("qpdf");
                return "ok";
            },
        },
        {
            name: "initCompressionEngine(ghostscript)",
            run: async () => {
                await initCompressionEngine("ghostscript");
                return "ok";
            },
        },
        {
            name: "inspectPdf",
            run: async () => {
                const info = await inspectPdf(sample);
                assert(info.numPages > 0, "numPages was 0");
                pageCount = info.numPages;
                return `${info.numPages} pages, PDF ${info.pdfVersion}`;
            },
        },
        {
            name: "checkPdf (valid input)",
            run: async () => {
                const result = await checkPdf(sample);
                assert(result.isValid, "expected the sample PDF to be valid");
                return "isValid: true";
            },
        },
        {
            name: "checkPdf (corrupt input)",
            run: async () => {
                const result = await checkPdf(new Uint8Array([1, 2, 3, 4]));
                assert(!result.isValid, "expected corrupt bytes to be invalid");
                return `isValid: false, ${result.warnings.length} warning(s)`;
            },
        },
        {
            name: "inspectPdf (corrupt input) throws + isQpdfError",
            run: async () => {
                try {
                    await inspectPdf(new Uint8Array([1, 2, 3, 4]));
                    throw new Error("expected inspectPdf to throw on corrupt input");
                } catch (error) {
                    assert(isQpdfError(error), "isQpdfError() did not recognize the thrown error");
                    assert(error instanceof QpdfError, "thrown error is not a QpdfError instance");
                    return (error as Error).constructor.name;
                }
            },
        },
        {
            name: "compressPdf (engine: qpdf, preset: web)",
            run: async () => {
                const result = await compressPdf(sample, { engine: "qpdf", preset: "web" });
                assert(isPdf(result.data), "compressed output is not a valid PDF");
                assert(result.compressedSize > 0, "compressed size is 0");
                return `${formatBytes(result.originalSize)} → ${formatBytes(result.compressedSize)}`;
            },
        },
        {
            name: "compressPdf (engine: ghostscript, pdfSettings: screen)",
            run: async () => {
                const result = await compressPdf(sample, { engine: "ghostscript", pdfSettings: "screen" });
                assert(isPdf(result.data), "compressed output is not a valid PDF");
                assert(result.compressedSize > 0, "compressed size is 0");
                return `${formatBytes(result.originalSize)} → ${formatBytes(result.compressedSize)}`;
            },
        },
        {
            name: "optimizePdf (qpdf subpath, preset: archive)",
            run: async () => {
                const result = await optimizePdf(sample, { preset: "archive" });
                assert(isPdf(result.data), "optimized output is not a valid PDF");
                return formatBytes(result.compressedSize);
            },
        },
        {
            name: "linearizePdf (qpdf subpath)",
            run: async () => {
                const result = await linearizePdf(sample);
                assert(isPdf(result.data), "linearized output is not a valid PDF");
                return formatBytes(result.compressedSize);
            },
        },
        {
            name: "compressPdfWithQpdf (qpdf subpath)",
            run: async () => {
                const result = await compressPdfWithQpdf(sample, { preset: "default" });
                assert(isPdf(result.data), "output is not a valid PDF");
                return formatBytes(result.compressedSize);
            },
        },
        {
            name: "compressPdfWithGhostscript (ghostscript subpath)",
            run: async () => {
                const result = await compressPdfWithGhostscript(sample, { pdfSettings: "ebook" });
                assert(isPdf(result.data), "output is not a valid PDF");
                return formatBytes(result.compressedSize);
            },
        },
        {
            name: "rewritePdfWithGhostscript (ghostscript subpath)",
            run: async () => {
                const data = await rewritePdfWithGhostscript(sample, { pdfSettings: "printer" });
                assert(isPdf(data), "output is not a valid PDF");
                return formatBytes(data.byteLength);
            },
        },
        {
            name: "compressPdfWithGhostscript validation + isGhostscriptError",
            run: async () => {
                try {
                    await compressPdfWithGhostscript(sample, { jpegQuality: 999 });
                    throw new Error("expected a validation error for jpegQuality out of range");
                } catch (error) {
                    assert(isGhostscriptError(error), "isGhostscriptError() did not recognize the thrown error");
                    assert(error instanceof GhostscriptValidationError, "thrown error is not a GhostscriptValidationError");
                    return (error as Error).message;
                }
            },
        },
        {
            name: "QpdfDocument (open, getters, write, dispose)",
            run: async () => {
                const doc = await QpdfDocument.open(sample);
                assert(doc.pageCount === pageCount, `pageCount mismatch: ${doc.pageCount} !== ${pageCount}`);
                assert(doc.pdfVersion.length > 0, "pdfVersion getter empty");
                assert(typeof doc.isEncrypted === "boolean", "isEncrypted getter not boolean");
                assert(typeof doc.isLinearized === "boolean", "isLinearized getter not boolean");
                const written = await doc.write({ linearize: true });
                assert(isPdf(written), "write() output is not a valid PDF");
                const summary = `${doc.pageCount} pages, v${doc.pdfVersion}`;
                doc.dispose();
                return summary;
            },
        },
        {
            name: "splitPdf",
            run: async () => {
                const result = await splitPdf(sample);
                assert(result.pageCount === pageCount, `split produced ${result.pageCount} pages, expected ${pageCount}`);
                assert(result.pages.every(isPdf), "not every split page is a valid PDF");
                splitPages = result.pages;
                return `${result.pageCount} pages`;
            },
        },
        {
            name: "mergePdfs",
            run: async () => {
                assert(splitPages.length >= 2, "need at least 2 split pages (run splitPdf first)");
                const result = await mergePdfs([splitPages[0], splitPages[1]]);
                assert(result.sourceCount === 2, "sourceCount mismatch");
                assert(isPdf(result.data), "merged output is not a valid PDF");
                return `${formatBytes(result.data.byteLength)} from ${result.sourceCount} sources`;
            },
        },
        {
            name: "organizePdf",
            run: async () => {
                const reversed = Array.from({ length: pageCount }, (_, i) => pageCount - 1 - i);
                const result = await organizePdf(sample, { pages: reversed });
                assert(result.pageCount === pageCount, "organize output page count mismatch");
                assert(isPdf(result.data), "organized output is not a valid PDF");
                return `reversed ${pageCount} pages`;
            },
        },
        {
            name: "extractImages",
            run: async () => {
                const result = await extractImages(sample);
                assert(result.imageCount === result.images.length, "imageCount/images length mismatch");
                return `${result.imageCount} image(s) found`;
            },
        },
        {
            name: "formatBytes / calculateSavings / formatPercentage",
            run: () => {
                assert(formatBytes(1536) === "1.5 KB", `unexpected formatBytes output: ${formatBytes(1536)}`);
                const savings = calculateSavings(1000, 400);
                assert(savings.savedBytes === 600, "savedBytes mismatch");
                assert(formatPercentage(-40) === "-40.0%", `unexpected formatPercentage output: ${formatPercentage(-40)}`);
                return `${formatBytes(1536)}, saved ${savings.savedBytes}B, ${formatPercentage(-40)}`;
            },
        },
        {
            name: "QPDF_PRESETS / GHOSTSCRIPT_PRESETS constants",
            run: () => {
                assert("default" in QPDF_PRESETS && "web" in QPDF_PRESETS && "archive" in QPDF_PRESETS, "missing qpdf presets");
                assert("default" in GHOSTSCRIPT_PRESETS && "screen" in GHOSTSCRIPT_PRESETS, "missing ghostscript presets");
                return `${Object.keys(QPDF_PRESETS).length} qpdf presets, ${Object.keys(GHOSTSCRIPT_PRESETS).length} ghostscript presets`;
            },
        },
        {
            name: "qpdf binding registry (get/set/reset)",
            run: () => {
                const binding = getQpdfBinding();
                assert(typeof binding.getVersion === "function", "binding missing getVersion");
                setQpdfBinding(binding);
                resetQpdfBinding();
                return "round-trip ok";
            },
        },
        {
            name: "ghostscript binding registry (get/set/reset)",
            run: () => {
                const binding = getGhostscriptBinding();
                assert(typeof binding.getVersion === "function", "binding missing getVersion");
                setGhostscriptBinding(binding);
                resetGhostscriptBinding();
                return "round-trip ok";
            },
        },
    ];

    let passed = 0;
    for (const step of steps) {
        // Steps run sequentially: several depend on state (pageCount, splitPages)
        // produced by earlier steps.
        if (await runStep(step)) passed += 1;
    }

    if (summaryEl) {
        summaryEl.textContent = `${passed}/${steps.length} checks passed`;
        summaryEl.className = passed === steps.length ? "all-pass" : "some-fail";
    }
}

main().catch((error) => {
    if (summaryEl) {
        summaryEl.textContent = `Fatal error: ${error instanceof Error ? error.message : String(error)}`;
        summaryEl.className = "some-fail";
    }
    console.error(error);
});
