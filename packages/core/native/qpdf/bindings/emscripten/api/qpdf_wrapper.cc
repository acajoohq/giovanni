// QPDFWrapper / QPDFWriterWrapper — advanced JS API for fine-grained control

#include "../qpdf_wasm.hh"
#include <qpdf/Pl_Flate.hh>
#include <qpdf/QPDFPageDocumentHelper.hh>
#include <stdexcept>

QPDFWrapper::QPDFWrapper() : initialized(false) {}

void QPDFWrapper::processMemoryFile(const emscripten::val& inputArray, const std::string& password) {
    try {
        std::vector<uint8_t> inputData = emscripten::vecFromJSArray<uint8_t>(inputArray);

        const char* pwd = password.empty() ? nullptr : password.c_str();
        pdf.processMemoryFile("input.pdf",
                             reinterpret_cast<const char*>(inputData.data()),
                             inputData.size(),
                             pwd);
        initialized = true;
    } catch (const std::exception& e) {
        throw std::runtime_error(std::string("processMemoryFile failed: ") + e.what());
    }
}

int QPDFWrapper::getNumPages() {
    if (!initialized) {
        throw std::runtime_error("QPDF not initialized. Call processMemoryFile first.");
    }

    return static_cast<int>(pdf.getAllPages().size());
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

void QPDFWrapper::coalesceContentStreams() {
    if (!initialized) {
        throw std::runtime_error("QPDF not initialized. Call processMemoryFile first.");
    }

    auto pages = pdf.getAllPages();
    for (auto& page : pages) {
        page.coalesceContentStreams();
    }
}

void QPDFWrapper::removeUnreferencedResources() {
    if (!initialized) {
        throw std::runtime_error("QPDF not initialized. Call processMemoryFile first.");
    }

    QPDFPageDocumentHelper(pdf).removeUnreferencedResources();
}

QPDF& QPDFWrapper::getQPDF() {
    if (!initialized) {
        throw std::runtime_error("QPDF not initialized. Call processMemoryFile first.");
    }

    return pdf;
}

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

void QPDFWriterWrapper::setLinearization(bool linearize) {
    writer->setLinearization(linearize);
}

void QPDFWriterWrapper::write() {
    try {
        Pl_Flate::setCompressionLevel(compressionLevel);
        writer->write();
    } catch (const std::exception& e) {
        throw std::runtime_error(std::string("write failed: ") + e.what());
    }
}

emscripten::val QPDFWriterWrapper::getBuffer() {
    std::shared_ptr<Buffer> buffer = writer->getBufferSharedPointer();

    return bufferToUint8Array(buffer);
}