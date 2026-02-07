// Embind bindings for qpdf WASM module
// Exposes C++ API to JavaScript

#include "qpdf_wasm_api.hh"
#include <emscripten/bind.h>

using namespace emscripten;

EMSCRIPTEN_BINDINGS(qpdf_module) {
    // CompressionOptions value object
    value_object<CompressionOptions>("CompressionOptions")
        .field("compressionLevel", &CompressionOptions::compressionLevel)
        .field("recompressFlate", &CompressionOptions::recompressFlate)
        .field("decodeLevel", &CompressionOptions::decodeLevel);

    // Simple API: compressPdf function
    function("compressPdf", &compressPdf,
             allow_raw_pointers());

    // Utility function: get version
    function("getQpdfVersion", &getQpdfVersion);

    // Advanced API: QPDF wrapper class
    class_<QPDFWrapper>("QPDF")
        .constructor<>()
        .function("processMemoryFile",
                  select_overload<void(const val&, const std::string&)>(&QPDFWrapper::processMemoryFile),
                  allow_raw_pointers())
        .function("getNumPages", &QPDFWrapper::getNumPages)
        .function("getPDFVersion", &QPDFWrapper::getPDFVersion)
        .function("isEncrypted", &QPDFWrapper::isEncrypted)
        .function("isLinearized", &QPDFWrapper::isLinearized);

    // Advanced API: QPDFWriter wrapper class
    class_<QPDFWriterWrapper>("QPDFWriter")
        .constructor<QPDFWrapper&>()
        .function("setCompressStreams", &QPDFWriterWrapper::setCompressStreams)
        .function("setRecompressFlate", &QPDFWriterWrapper::setRecompressFlate)
        .function("setDecodeLevel", &QPDFWriterWrapper::setDecodeLevel)
        .function("setCompressionLevel", &QPDFWriterWrapper::setCompressionLevel)
        .function("setObjectStreamMode", &QPDFWriterWrapper::setObjectStreamMode)
        .function("write", &QPDFWriterWrapper::write)
        .function("getBuffer", &QPDFWriterWrapper::getBuffer);
}
