// WASM API for qpdf compression
// Provides a simple compressPdf() function for client-side PDF compression

#include "qpdf_wasm_api.hh"
#include <qpdf/QUtil.hh>
#include <qpdf/Pl_Flate.hh>
#include <qpdf/Pl_Buffer.hh>
#include <qpdf/Buffer.hh>
#include <qpdf/QPDFPageDocumentHelper.hh>
#include <qpdf/QPDFPageObjectHelper.hh>
#include <qpdf/QPDFObjGen.hh>
#include <vector>
#include <set>
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
            const auto& inputData = allInputData.back();   // stable reference

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

// Helpers for image extraction

static std::string stripLeadingSlash(const std::string& name) {
    if (!name.empty() && name[0] == '/') {
        return name.substr(1);
    }
    return name;
}

// The PDF /Filter entry can be a single name or an array. Return the last
// non-ASCII filter, since ASCII85Decode/ASCIIHexDecode are wrappers that qpdf
// will strip transparently. For our purposes the leaf filter determines whether
// the raw bytes are already a JPEG/JPX, raw pixels, or something else.
static std::string getLeafImageFilter(QPDFObjectHandle& streamDict) {
    QPDFObjectHandle filterObj = streamDict.getKey("/Filter");
    if (filterObj.isNull()) {
        return "none";
    }
    if (filterObj.isName()) {
        return stripLeadingSlash(filterObj.getName());
    }
    if (filterObj.isArray()) {
        int n = filterObj.getArrayNItems();
        for (int i = n - 1; i >= 0; i--) {
            QPDFObjectHandle item = filterObj.getArrayItem(i);
            if (!item.isName()) continue;
            std::string name = stripLeadingSlash(item.getName());
            if (name == "ASCII85Decode" || name == "ASCIIHexDecode") {
                continue;
            }
            return name;
        }
        return "none";
    }
    return "unknown";
}

static std::string getColorSpaceString(QPDFObjectHandle& streamDict) {
    QPDFObjectHandle cs = streamDict.getKey("/ColorSpace");
    if (cs.isNull()) {
        return "";
    }
    if (cs.isName()) {
        return cs.getName();
    }
    return cs.unparse();
}

// Resolve a color space to a component count so the TS side can decode raw
// pixel data without parsing the PDF colour-space syntax. Returns 0 for color
// spaces we can't reliably infer (Indexed, Pattern, Separation, etc.) — the
// caller treats those as unsupported.
//
// NOTE: this only counts channels; it does not perform color management.
// For ICCBased / Cal* / Lab spaces the TS renderer treats RGB as sRGB and
// CMYK with a naive (1-c)(1-k) conversion. That's accurate enough for
// thumbnails and casual previews, but visibly off for color-critical work.
static int getColorSpaceComponents(QPDFObjectHandle& streamDict) {
    QPDFObjectHandle cs = streamDict.getKey("/ColorSpace");
    if (cs.isNull()) {
        // Image masks ("/ImageMask true") have no /ColorSpace and are 1-bit
        // single-channel by definition.
        QPDFObjectHandle imObj = streamDict.getKey("/ImageMask");
        if (imObj.isBool() && imObj.getBoolValue()) {
            return 1;
        }
        return 0;
    }

    if (cs.isName()) {
        std::string name = stripLeadingSlash(cs.getName());
        if (name == "DeviceGray" || name == "G" || name == "CalGray") return 1;
        if (name == "DeviceRGB" || name == "RGB" || name == "CalRGB" || name == "Lab") return 3;
        if (name == "DeviceCMYK" || name == "CMYK") return 4;
        return 0;
    }

    if (cs.isArray() && cs.getArrayNItems() > 0) {
        QPDFObjectHandle head = cs.getArrayItem(0);
        if (!head.isName()) return 0;
        std::string family = stripLeadingSlash(head.getName());

        if (family == "ICCBased" && cs.getArrayNItems() > 1) {
            QPDFObjectHandle profile = cs.getArrayItem(1);
            if (profile.isStream()) {
                QPDFObjectHandle profileDict = profile.getDict();
                QPDFObjectHandle nObj = profileDict.getKey("/N");
                if (nObj.isInteger()) {
                    int n = static_cast<int>(nObj.getIntValue());
                    if (n == 1 || n == 3 || n == 4) return n;
                }
            }
            return 0;
        }

        if (family == "CalGray") return 1;
        if (family == "CalRGB" || family == "Lab") return 3;

        // Indexed, Pattern, Separation, DeviceN — treat as unsupported for v1.
        return 0;
    }

    return 0;
}

static emscripten::val bufferToUint8Array(std::shared_ptr<Buffer>& buffer) {
    const unsigned char* data = buffer->getBuffer();
    size_t size = buffer->getSize();
    auto view = emscripten::typed_memory_view(size, data);
    emscripten::val uint8Array = emscripten::val::global("Uint8Array").new_(size);
    uint8Array.call<void>("set", view);
    return uint8Array;
}

// Pipe a stream's data into a Pl_Buffer at the given decode level. Uses the
// modern pipeStreamData signature (returns true on success, sets
// filtering_attempted) so qpdf doesn't throw on streams it can't decode —
// which matters because the WASM build runs without C++ exception catching,
// where a throw becomes an abort().
static bool pipeImageData(QPDFObjectHandle& image,
                          qpdf_stream_decode_level_e level,
                          std::shared_ptr<Buffer>& outBuf) {
    Pl_Buffer pipeline("image-buffer");
    bool filteringAttempted = false;
    bool ok = image.pipeStreamData(&pipeline,
                                   &filteringAttempted,
                                   /* encode_flags */ 0,
                                   level,
                                   /* suppress_warnings */ true,
                                   /* will_retry */ false);
    if (!ok) {
        return false;
    }
    outBuf = pipeline.getBufferSharedPointer();
    return true;
}

// Extract every embedded raster image from a PDF.
//
// Returns a JS array of image records: { objectKey, xobjectKey, pageIndex,
// filter, width, height, bitsPerComponent, colorSpace, hasMask, hasSMask,
// isImageMask, strategy, bytes }.
//
// strategy is one of:
//   "encoded"     — bytes are a complete JPEG/JPX, browser can decode directly
//   "raw-pixels"  — bytes are uncompressed pixels (caller must encode to PNG)
//   "unsupported" — bytes are raw filtered stream; browser cannot decode (CCITT, JBIG2, ...)
//   "error"       — qpdf could not read the stream (bytes is empty)
emscripten::val extractImages(const emscripten::val& inputArray) {
    try {
        std::vector<uint8_t> inputData = emscripten::vecFromJSArray<uint8_t>(inputArray);

        QPDF pdf;
        pdf.processMemoryFile("input.pdf",
                             reinterpret_cast<const char*>(inputData.data()),
                             inputData.size());

        emscripten::val result = emscripten::val::array();
        std::set<std::string> seenObjGens;

        auto pages = QPDFPageDocumentHelper(pdf).getAllPages();

        // Promote inline images to regular XObjects so forEachImage picks them up.
        for (auto& page : pages) {
            page.externalizeInlineImages();
        }

        for (size_t pageIndex = 0; pageIndex < pages.size(); pageIndex++) {
            int pageIndexInt = static_cast<int>(pageIndex);

            pages[pageIndex].forEachImage(
                /* recursive */ true,
                [&](QPDFObjectHandle& image, QPDFObjectHandle& /*xobjDict*/, const std::string& key) {
                    QPDFObjGen og = image.getObjGen();
                    std::string ogKey = std::to_string(og.getObj()) + "/" + std::to_string(og.getGen());
                    if (seenObjGens.contains(ogKey)) {
                        return;
                    }
                    seenObjGens.insert(ogKey);

                    QPDFObjectHandle dict = image.getDict();
                    std::string filter = getLeafImageFilter(dict);

                    int width = 0;
                    int height = 0;
                    int bitsPerComponent = 8;

                    QPDFObjectHandle wObj = dict.getKey("/Width");
                    if (wObj.isInteger()) {
                        width = static_cast<int>(wObj.getIntValue());
                    }
                    QPDFObjectHandle hObj = dict.getKey("/Height");
                    if (hObj.isInteger()) {
                        height = static_cast<int>(hObj.getIntValue());
                    }
                    QPDFObjectHandle bpcObj = dict.getKey("/BitsPerComponent");
                    if (bpcObj.isInteger()) {
                        bitsPerComponent = static_cast<int>(bpcObj.getIntValue());
                    }

                    std::string colorSpace = getColorSpaceString(dict);
                    int components = getColorSpaceComponents(dict);
                    bool hasMask = !dict.getKey("/Mask").isNull();
                    bool hasSMask = !dict.getKey("/SMask").isNull();
                    bool isImageMask = false;
                    QPDFObjectHandle imObj = dict.getKey("/ImageMask");
                    if (imObj.isBool()) {
                        isImageMask = imObj.getBoolValue();
                    }

                    emscripten::val bytes = emscripten::val::global("Uint8Array").new_(0);
                    std::string strategy = "error";
                    std::shared_ptr<Buffer> buf;

                    if (filter == "DCTDecode" || filter == "JPXDecode") {
                        // qpdf_dl_generalized strips ASCII wrappers but leaves DCT/JPX intact,
                        // so the resulting bytes are a complete JPEG/JPX file.
                        if (pipeImageData(image, qpdf_dl_generalized, buf) && buf) {
                            bytes = bufferToUint8Array(buf);
                            strategy = "encoded";
                        }
                    } else if (filter == "FlateDecode" || filter == "LZWDecode"
                               || filter == "RunLengthDecode" || filter == "none") {
                        // qpdf decodes these natively, returning raw pixel data.
                        if (pipeImageData(image, qpdf_dl_specialized, buf) && buf) {
                            bytes = bufferToUint8Array(buf);
                            strategy = "raw-pixels";
                        }
                    } else {
                        // CCITTFax, JBIG2, etc. — qpdf cannot decode; surface raw bytes
                        // so the caller can offer a download or wire up a JS fallback.
                        // Use pipeStreamData with qpdf_dl_none to avoid any throw paths.
                        if (pipeImageData(image, qpdf_dl_none, buf) && buf) {
                            bytes = bufferToUint8Array(buf);
                            strategy = "unsupported";
                        }
                    }

                    emscripten::val info = emscripten::val::object();
                    info.set("objectKey", ogKey);
                    info.set("xobjectKey", key);
                    info.set("pageIndex", pageIndexInt);
                    info.set("filter", filter);
                    info.set("width", width);
                    info.set("height", height);
                    info.set("bitsPerComponent", bitsPerComponent);
                    info.set("colorSpace", colorSpace);
                    info.set("components", components);
                    info.set("hasMask", hasMask);
                    info.set("hasSMask", hasSMask);
                    info.set("isImageMask", isImageMask);
                    info.set("strategy", strategy);
                    info.set("bytes", bytes);

                    result.call<void>("push", info);
                });
        }

        return result;

    } catch (const std::exception& e) {
        std::string errorMsg = std::string("PDF image extraction failed: ") + e.what();
        throw std::runtime_error(errorMsg);
    }
}


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
