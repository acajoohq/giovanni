#include "../qpdf_wasm.hh"
#include <qpdf/Pl_Flate.hh>
#include <qpdf/QPDFPageDocumentHelper.hh>
#include <stdexcept>

emscripten::val compressPdf(const emscripten::val& inputArray, const CompressionOptions& options) {
    try {
        std::vector<uint8_t> inputData = emscripten::vecFromJSArray<uint8_t>(inputArray);

        if (options.compressionLevel >= 1 && options.compressionLevel <= 9) {
            Pl_Flate::setCompressionLevel(options.compressionLevel);
        }

        QPDF pdf;
        pdf.processMemoryFile("input.pdf",
                             reinterpret_cast<const char*>(inputData.data()),
                             inputData.size());

        if (options.compressPages) {
            auto pages = pdf.getAllPages();
            for (auto& page : pages) {
                page.coalesceContentStreams();
            }
        }
        if (options.removeUnreferencedResources) {
            QPDFPageDocumentHelper(pdf).removeUnreferencedResources();
        }

        QPDFWriter writer(pdf);
        writer.setOutputMemory();
        writer.setCompressStreams(true);
        writer.setRecompressFlate(options.recompressFlate);
        writer.setDecodeLevel(getDecodeLevel(options.decodeLevel));
        writer.setObjectStreamMode(getObjectStreamMode(options.objectStreams));
        writer.write();

        std::shared_ptr<Buffer> buffer = writer.getBufferSharedPointer();

        return bufferToUint8Array(buffer);

    } catch (const std::exception& e) {
        throw std::runtime_error(std::string("PDF compression failed: ") + e.what());
    }
}
