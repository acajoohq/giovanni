// Header file for qpdf WASM API
// Declarations only - implementation in qpdf_wasm_api.cc

#ifndef QPDF_WASM_API_HH
#define QPDF_WASM_API_HH

#include <qpdf/QPDF.hh>
#include <qpdf/QPDFWriter.hh>
#include <qpdf/Constants.h>
#include <string>
#include <memory>
#include <vector>
#include <emscripten/val.h>

// Compression options structure
struct CompressionOptions {
    int compressionLevel = 9;
    bool recompressFlate = true;
    std::string decodeLevel = "generalized";

    CompressionOptions() = default;
};

// Function declarations
qpdf_stream_decode_level_e getDecodeLevel(const std::string& level);
emscripten::val compressPdf(const emscripten::val& inputArray, const CompressionOptions& options);
std::string getQpdfVersion();
emscripten::val splitPages(const emscripten::val& inputArray);

// QPDFWrapper class declaration
class QPDFWrapper {
private:
    QPDF pdf;
    bool initialized;

public:
    QPDFWrapper();
    void processMemoryFile(const emscripten::val& inputArray, const std::string& password = "");
    int getNumPages();
    std::string getPDFVersion();
    bool isEncrypted();
    bool isLinearized();
    QPDF& getQPDF();
};

// QPDFWriterWrapper class declaration
class QPDFWriterWrapper {
private:
    QPDFWrapper* qpdfWrapper;
    std::unique_ptr<QPDFWriter> writer;

public:
    QPDFWriterWrapper(QPDFWrapper& qpdf);
    void setCompressStreams(bool compress);
    void setRecompressFlate(bool recompress);
    void setDecodeLevel(const std::string& level);
    void setCompressionLevel(int level);
    void setObjectStreamMode(const std::string& mode);
    void write();
    emscripten::val getBuffer();
};

#endif // QPDF_WASM_API_HH
