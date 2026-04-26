// WASM API for qpdf compression
// Provides a simple compressPdf() function for client-side PDF compression

#include "qpdf_wasm_api.hh"
#include <qpdf/QUtil.hh>
#include <qpdf/Pl_Flate.hh>
#include <qpdf/Buffer.hh>
#include <qpdf/QPDFPageDocumentHelper.hh>
#include <vector>
#include <stdexcept>

// Convert decodeLevel string to enum
qpdf_stream_decode_level_e getDecodeLevel(const std::string& level) {
    if (level == "none") {
        return qpdf_dl_none;
    } else if (level == "generalized") {
        return qpdf_dl_generalized;
    } else if (level == "specialized") {
        return qpdf_dl_specialized;
    } else if (level == "all") {
        return qpdf_dl_all;
    }

    return qpdf_dl_generalized;
}

qpdf_object_stream_e getObjectStreamMode(const std::string& mode) {
    if (mode == "disable") {
        return qpdf_o_disable;
    } else if (mode == "preserve") {
        return qpdf_o_preserve;
    } else if (mode == "generate") {
        return qpdf_o_generate;
    }

    return qpdf_o_preserve;
}

// #region Main Compression API
// Main compression function
// Takes a Uint8Array of PDF data and returns compressed Uint8Array
emscripten::val compressPdf(const emscripten::val& inputArray, const CompressionOptions& options) {
    try {
        // Convert JavaScript Uint8Array to std::vector<uint8_t>
        std::vector<uint8_t> inputData = emscripten::vecFromJSArray<uint8_t>(inputArray);

        if (options.compressionLevel >= 1 && options.compressionLevel <= 9) {
            Pl_Flate::setCompressionLevel(options.compressionLevel);
        }

        // Create QPDF object and process the input PDF
        QPDF pdf;
        pdf.processMemoryFile("input.pdf",
                             reinterpret_cast<const char*>(inputData.data()),
                             inputData.size());

        if (options.compressPages) {
            auto pages = pdf.getAllPages();
            for (auto& page: pages) {
                page.coalesceContentStreams();
            }
        }

        if (options.removeUnreferencedResources) {
            QPDFPageDocumentHelper(pdf).removeUnreferencedResources();
        }

        // Create QPDFWriter to write to memory
        QPDFWriter writer(pdf);
        writer.setOutputMemory();

        // Configure compression settings
        writer.setCompressStreams(true);
        writer.setRecompressFlate(options.recompressFlate);
        writer.setDecodeLevel(getDecodeLevel(options.decodeLevel));
        writer.setObjectStreamMode(getObjectStreamMode(options.objectStreams));

        // Write the PDF
        writer.write();

        // Get the output buffer
        std::shared_ptr<Buffer> buffer = writer.getBufferSharedPointer();
        const unsigned char* outputData = buffer->getBuffer();
        size_t outputSize = buffer->getSize();

        // Create a typed memory view for the output data
        auto view = emscripten::typed_memory_view(outputSize, outputData);

        // Create JavaScript Uint8Array for output
        emscripten::val uint8Array = emscripten::val::global("Uint8Array").new_(outputSize);

        // Copy data from C++ to JavaScript
        uint8Array.call<void>("set", view);

        return uint8Array;

    } catch (const std::exception& e) {
        std::string errorMsg = std::string("PDF compression failed: ") + e.what();
        throw std::runtime_error(errorMsg);
    }
}
// #endregion

// Get qpdf version
std::string getQpdfVersion() {
    return QPDF::QPDFVersion();
}


// #region Split Pages API
// Split PDF into individual pages
// Takes a Uint8Array and returns a JS Array of Uint8Arrays (one per page)
emscripten::val splitPages(const emscripten::val& inputArray) {
    try {
        std::vector<uint8_t> inputData = emscripten::vecFromJSArray<uint8_t>(inputArray);

        QPDF pdf;
        pdf.processMemoryFile("input.pdf",
                             reinterpret_cast<const char*>(inputData.data()),
                             inputData.size());

        auto pages = pdf.getAllPages();
        emscripten::val result = emscripten::val::array();

        for (size_t i = 0; i < pages.size(); i++) {
            QPDF outPdf;
            outPdf.emptyPDF();
            outPdf.addPage(pages[i], false);

            QPDFWriter writer(outPdf);
            writer.setOutputMemory();
            writer.setObjectStreamMode(qpdf_o_generate);
            writer.write();

            std::shared_ptr<Buffer> buffer = writer.getBufferSharedPointer();
            const unsigned char* outputData = buffer->getBuffer();
            size_t outputSize = buffer->getSize();

            emscripten::val uint8Array = emscripten::val::global("Uint8Array").new_(outputSize);

            // Create a typed memory view for the output data
            auto view = emscripten::typed_memory_view(outputSize, outputData);

            // Copy data from C++ to JavaScript
            uint8Array.call<void>("set", view);
            result.call<void>("push", uint8Array);
        }

        return result;

    } catch (const std::exception& e) {
        std::string errorMsg = std::string("PDF split failed: ") + e.what();
        throw std::runtime_error(errorMsg);
    }
}
// #endregion

// #region Merge Pages API
// Merge multiple PDFs into a single PDF
// Takes a JS Array of Uint8Arrays and returns a single Uint8Array
emscripten::val mergePdfs(const emscripten::val& inputArrays) {
    try {
        int length = inputArrays["length"].as<int>();
        if (length == 0) {
            throw std::runtime_error("No PDFs provided to merge");
        }

        QPDF outPdf;
        outPdf.emptyPDF();

        // Keep source PDFs alive until write() is complete
        std::vector<std::vector<uint8_t>> allInputData;
        std::vector<std::unique_ptr<QPDF>> sourcePdfs;
        allInputData.reserve(length);
        sourcePdfs.reserve(length);

        for (int i = 0; i < length; i++) {
            allInputData.emplace_back(emscripten::vecFromJSArray<uint8_t>(inputArrays[i]));
            const auto& inputData = allInputData.back();   // ← stable reference

            auto srcPdf = std::make_unique<QPDF>();
            std::string inputName = "input-" + std::to_string(i) + ".pdf";
            srcPdf->processMemoryFile(inputName.c_str(),
                                      reinterpret_cast<const char*>(inputData.data()),
                                      inputData.size());

            auto pages = srcPdf->getAllPages();
            for (auto& page : pages) {
                outPdf.addPage(page, false);
            }

            sourcePdfs.push_back(std::move(srcPdf));
        }

        QPDFWriter writer(outPdf);
        writer.setOutputMemory();
        writer.setObjectStreamMode(qpdf_o_generate);
        writer.write();

        std::shared_ptr<Buffer> buffer = writer.getBufferSharedPointer();
        const unsigned char* outputData = buffer->getBuffer();
        size_t outputSize = buffer->getSize();

        auto view = emscripten::typed_memory_view(outputSize, outputData);
        emscripten::val uint8Array = emscripten::val::global("Uint8Array").new_(outputSize);
        uint8Array.call<void>("set", view);

        return uint8Array;

    } catch (const std::exception& e) {
        std::string errorMsg = std::string("PDF merge failed: ") + e.what();
        throw std::runtime_error(errorMsg);
    }
}
// #endregion

QPDFWrapper::QPDFWrapper() : initialized(false) {}

void QPDFWrapper::processMemoryFile(const emscripten::val& inputArray, const std::string& password) {
    std::vector<uint8_t> inputData = emscripten::vecFromJSArray<uint8_t>(inputArray);

    const char* pwd = password.empty() ? nullptr : password.c_str();
    pdf.processMemoryFile("input.pdf",
                         reinterpret_cast<const char*>(inputData.data()),
                         inputData.size(),
                         pwd);
    initialized = true;
}

int QPDFWrapper::getNumPages() {
    if (!initialized) {
        throw std::runtime_error("QPDF not initialized. Call processMemoryFile first.");
    }
    auto pages = pdf.getAllPages();
    return static_cast<int>(pages.size());
}

std::string QPDFWrapper::getPDFVersion() {
    if (!initialized) {
        throw std::runtime_error("QPDF not initialized. Call processMemoryFile first.");
    }
    return pdf.getPDFVersion();
}

bool QPDFWrapper::isEncrypted() {
    if (!initialized) {
        throw std::runtime_error("QPDF not initialized. Call processMemoryFile first.");
    }
    return pdf.isEncrypted();
}

bool QPDFWrapper::isLinearized() {
    if (!initialized) {
        throw std::runtime_error("QPDF not initialized. Call processMemoryFile first.");
    }
    return pdf.isLinearized();
}

QPDF& QPDFWrapper::getQPDF() {
    if (!initialized) {
        throw std::runtime_error("QPDF not initialized. Call processMemoryFile first.");
    }
    return pdf;
}

// Advanced API: QPDFWriter wrapper

QPDFWriterWrapper::QPDFWriterWrapper(QPDFWrapper& qpdf) : qpdfWrapper(&qpdf), compressionLevel(6) {
    writer = std::make_unique<QPDFWriter>(qpdf.getQPDF());
    writer->setOutputMemory();
}

void QPDFWriterWrapper::setCompressStreams(bool compress) {
    writer->setCompressStreams(compress);
}

void QPDFWriterWrapper::setRecompressFlate(bool recompress) {
    writer->setRecompressFlate(recompress);
}

void QPDFWriterWrapper::setDecodeLevel(const std::string& level) {
    writer->setDecodeLevel(getDecodeLevel(level));
}

void QPDFWriterWrapper::setCompressionLevel(int level) {
    if (level >= 1 && level <= 9) {
        compressionLevel = level;
    }
}

void QPDFWriterWrapper::setObjectStreamMode(const std::string& mode) {
    writer->setObjectStreamMode(getObjectStreamMode(mode));
}

void QPDFWriterWrapper::write() {
    Pl_Flate::setCompressionLevel(compressionLevel);
    writer->write();
}

emscripten::val QPDFWriterWrapper::getBuffer() {
    std::shared_ptr<Buffer> buffer = writer->getBufferSharedPointer();
    const unsigned char* outputData = buffer->getBuffer();
    size_t outputSize = buffer->getSize();

    auto view = emscripten::typed_memory_view(outputSize, outputData);
    emscripten::val uint8Array = emscripten::val::global("Uint8Array").new_(outputSize);
    uint8Array.call<void>("set", view);

    return uint8Array;
}
