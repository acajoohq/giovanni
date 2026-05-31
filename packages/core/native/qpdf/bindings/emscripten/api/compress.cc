// Thin wrapper — marshals JS types and delegates to QpdfEngine::writePdf.

#include "../qpdf_wasm.hh"
#include "qpdf_engine.h"
#include <stdexcept>

emscripten::val compressPdf(const emscripten::val& inputArray, const CompressionOptions& opts) {
    try {
        std::vector<uint8_t> input = emscripten::vecFromJSArray<uint8_t>(inputArray);

        pdfly::WriteOptions options;
        options.compressionLevel          = opts.compressionLevel;
        options.recompressFlate           = opts.recompressFlate;
        options.decodeLevel               = opts.decodeLevel;
        options.objectStreams              = opts.objectStreams;
        options.compressPages             = opts.compressPages;
        options.removeUnreferencedResources = opts.removeUnreferencedResources;
        options.linearize                 = opts.linearize;

        auto result = getEngine().writePdf(input, options, "");
        return vecToUint8Array(result);
    } catch (const std::exception& e) {
        throw std::runtime_error(std::string("PDF compression failed: ") + e.what());
    }
}
