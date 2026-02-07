// WASM API for qpdf compression
// Provides a simple compressPdf() function for client-side PDF compression

#include "qpdf_wasm_api.hh"
#include <qpdf/QUtil.hh>
#include <qpdf/Pl_Flate.hh>
#include <qpdf/Buffer.hh>
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
    } else {
        return qpdf_dl_generalized;  // Default
    }
}

// Main compression function
// Takes a Uint8Array of PDF data and returns compressed Uint8Array
emscripten::val compressPdf(const emscripten::val& inputArray, const CompressionOptions& options) {
    try {
        // Convert JavaScript Uint8Array to std::vector<uint8_t>
        unsigned int length = inputArray["length"].as<unsigned int>();
        std::vector<uint8_t> inputData(length);

        // Copy data from JavaScript to C++
        emscripten::val memory = emscripten::val::module_property("HEAPU8");
        emscripten::val memoryView = inputArray;

        for (unsigned int i = 0; i < length; i++) {
            inputData[i] = memoryView[i].as<uint8_t>();
        }

        // Set compression level for Flate
        if (options.compressionLevel >= 1 && options.compressionLevel <= 9) {
            Pl_Flate::setCompressionLevel(options.compressionLevel);
        }

        // Create QPDF object and process the input PDF
        QPDF pdf;
        pdf.processMemoryFile("input.pdf",
                             reinterpret_cast<const char*>(inputData.data()),
                             inputData.size());

        // Create QPDFWriter to write to memory
        QPDFWriter writer(pdf);
        writer.setOutputMemory();

        // Configure compression settings
        writer.setCompressStreams(true);
        writer.setRecompressFlate(options.recompressFlate);
        writer.setDecodeLevel(getDecodeLevel(options.decodeLevel));

        // Enable object streams for better compression
        writer.setObjectStreamMode(qpdf_o_generate);

        // Write the PDF
        writer.write();

        // Get the output buffer
        std::shared_ptr<Buffer> buffer = writer.getBufferSharedPointer();
        const unsigned char* outputData = buffer->getBuffer();
        size_t outputSize = buffer->getSize();

        // Create JavaScript Uint8Array for output
        emscripten::val uint8Array = emscripten::val::global("Uint8Array").new_(outputSize);

        // Copy data from C++ to JavaScript
        for (size_t i = 0; i < outputSize; i++) {
            uint8Array.set(i, emscripten::val(outputData[i]));
        }

        return uint8Array;

    } catch (const std::exception& e) {
        std::string errorMsg = std::string("PDF compression failed: ") + e.what();
        throw std::runtime_error(errorMsg);
    }
}

// Get qpdf version
std::string getQpdfVersion() {
    return QPDF::QPDFVersion();
}

// Advanced API: QPDF class wrapper for memory file processing

QPDFWrapper::QPDFWrapper() : initialized(false) {}

void QPDFWrapper::processMemoryFile(const emscripten::val& inputArray, const std::string& password) {
    // Convert JavaScript Uint8Array to vector
    unsigned int length = inputArray["length"].as<unsigned int>();
    std::vector<uint8_t> inputData(length);

    for (unsigned int i = 0; i < length; i++) {
        inputData[i] = inputArray[i].as<uint8_t>();
    }

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

QPDFWriterWrapper::QPDFWriterWrapper(QPDFWrapper& qpdf) : qpdfWrapper(&qpdf) {
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
        Pl_Flate::setCompressionLevel(level);
    }
}

void QPDFWriterWrapper::setObjectStreamMode(const std::string& mode) {
    if (mode == "disable") {
        writer->setObjectStreamMode(qpdf_o_disable);
    } else if (mode == "preserve") {
        writer->setObjectStreamMode(qpdf_o_preserve);
    } else if (mode == "generate") {
        writer->setObjectStreamMode(qpdf_o_generate);
    }
}

void QPDFWriterWrapper::write() {
    writer->write();
}

emscripten::val QPDFWriterWrapper::getBuffer() {
    std::shared_ptr<Buffer> buffer = writer->getBufferSharedPointer();
    const unsigned char* outputData = buffer->getBuffer();
    size_t outputSize = buffer->getSize();

    // Create JavaScript Uint8Array
    emscripten::val uint8Array = emscripten::val::global("Uint8Array").new_(outputSize);

    for (size_t i = 0; i < outputSize; i++) {
        uint8Array.set(i, emscripten::val(outputData[i]));
    }

    return uint8Array;
}
