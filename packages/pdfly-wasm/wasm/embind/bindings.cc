// embind bindings — expose the C++ API to JavaScript

#include "qpdf_wasm.hh"
#include <emscripten/bind.h>

using namespace emscripten;

EMSCRIPTEN_BINDINGS(qpdf_module) {
    value_object<CompressionOptions>("CompressionOptions")
        .field("compressionLevel", &CompressionOptions::compressionLevel)
        .field("recompressFlate", &CompressionOptions::recompressFlate)
        .field("decodeLevel", &CompressionOptions::decodeLevel)
        .field("objectStreams", &CompressionOptions::objectStreams)
        .field("compressPages", &CompressionOptions::compressPages)
        .field("removeUnreferencedResources", &CompressionOptions::removeUnreferencedResources)
        .field("linearize", &CompressionOptions::linearize);

    function("compressPdf", &compressPdf, allow_raw_pointers());
    function("splitPages", &splitPages);
    function("mergePdfs", &mergePdfs);
    function("extractImages", &extractImages);
    function("getQpdfVersion", &getQpdfVersion);

    class_<QPDFWrapper>("QPDF")
        .constructor<>()
        .function("processMemoryFile",
                  select_overload<void(const val&, const std::string&)>(&QPDFWrapper::processMemoryFile),
                  allow_raw_pointers())
        .function("getNumPages", &QPDFWrapper::getNumPages)
        .function("getPDFVersion", &QPDFWrapper::getPDFVersion)
        .function("isEncrypted", &QPDFWrapper::isEncrypted)
        .function("isLinearized", &QPDFWrapper::isLinearized)
        .function("coalesceContentStreams", &QPDFWrapper::coalesceContentStreams)
        .function("removeUnreferencedResources", &QPDFWrapper::removeUnreferencedResources);

    class_<QPDFWriterWrapper>("QPDFWriter")
        .constructor<QPDFWrapper&>()
        .function("setCompressStreams", &QPDFWriterWrapper::setCompressStreams)
        .function("setRecompressFlate", &QPDFWriterWrapper::setRecompressFlate)
        .function("setDecodeLevel", &QPDFWriterWrapper::setDecodeLevel)
        .function("setCompressionLevel", &QPDFWriterWrapper::setCompressionLevel)
        .function("setObjectStreamMode", &QPDFWriterWrapper::setObjectStreamMode)
        .function("setLinearization", &QPDFWriterWrapper::setLinearization)
        .function("write", &QPDFWriterWrapper::write)
        .function("getBuffer", &QPDFWriterWrapper::getBuffer);
}
