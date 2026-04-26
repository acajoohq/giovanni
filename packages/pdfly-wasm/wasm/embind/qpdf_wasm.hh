// declarations for the qpdf WASM module — implementations live under impl/

#ifndef QPDF_WASM_HH
#define QPDF_WASM_HH

#include <qpdf/QPDF.hh>
#include <qpdf/QPDFWriter.hh>
#include <qpdf/Buffer.hh>
#include <qpdf/Constants.h>
#include <emscripten/val.h>
#include <memory>
#include <string>
#include <vector>

struct CompressionOptions {
    int compressionLevel = 6;
    bool recompressFlate = true;
    std::string decodeLevel = "generalized";
    std::string objectStreams = "generate";
    bool compressPages = false;
    bool removeUnreferencedResources = false;

    CompressionOptions() = default;
};

// qpdf_utils.cc.
qpdf_stream_decode_level_e getDecodeLevel(const std::string& level);
qpdf_object_stream_e getObjectStreamMode(const std::string& mode);
std::string getQpdfVersion();
emscripten::val bufferToUint8Array(std::shared_ptr<Buffer>& buffer);

// compress.cc
emscripten::val compressPdf(const emscripten::val& inputArray, const CompressionOptions& options);

// split.cc
emscripten::val splitPages(const emscripten::val& inputArray);

// merge.cc
emscripten::val mergePdfs(const emscripten::val& inputArrays);

// extract_images.cc
emscripten::val extractImages(const emscripten::val& inputArray);

// qpdf_wrapper.cc
class QPDFWrapper {
public:
    QPDFWrapper();
    void processMemoryFile(const emscripten::val& inputArray, const std::string& password = "");
    int getNumPages();
    std::string getPDFVersion();
    bool isEncrypted();
    bool isLinearized();
    QPDF& getQPDF();

private:
    QPDF pdf;
    bool initialized;
};

class QPDFWriterWrapper {
public:
    QPDFWriterWrapper(QPDFWrapper& qpdf);
    void setCompressStreams(bool compress);
    void setRecompressFlate(bool recompress);
    void setDecodeLevel(const std::string& level);
    void setCompressionLevel(int level);
    void setObjectStreamMode(const std::string& mode);
    void write();
    emscripten::val getBuffer();

private:
    QPDFWrapper* qpdfWrapper;
    std::unique_ptr<QPDFWriter> writer;
    int compressionLevel;
};

#endif // QPDF_WASM_HH
