// image extraction: walks pages, gathers image XObjects, returns metadata + bytes
// per-filter strategy is chosen so the browser does the actual pixel decoding

#include "../qpdf_wasm.hh"
#include <qpdf/QPDFObjectHandle.hh>
#include <qpdf/QPDFObjGen.hh>
#include <qpdf/QPDFPageDocumentHelper.hh>
#include <qpdf/QPDFPageObjectHelper.hh>
#include <qpdf/Pl_Buffer.hh>
#include <set>
#include <stdexcept>

static std::string stripLeadingSlash(const std::string& name) {
    if (!name.empty() && name[0] == '/') {
        return name.substr(1);
    }

    return name;
}

// the leaf filter (last non-ASCII entry) determines whether raw bytes are a
// complete JPEG/JPX, raw pixels, or something else
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

// resolve a color space to a component count (0 = unsupported)
// only counts channels; the TS renderer applies no color management,
// so ICCBased/Cal*/Lab fall back to sRGB and CMYK uses a naive (1-c)(1-k)
static int getColorSpaceComponents(QPDFObjectHandle& streamDict) {
    QPDFObjectHandle cs = streamDict.getKey("/ColorSpace");
    if (cs.isNull()) {
        // image masks have no /ColorSpace and are 1-bit single-channel
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

        // Indexed, Pattern, Separation, DeviceN — unsupported for v1
        return 0;
    }

    return 0;
}

// pipe stream data into a buffer at the given decode level
// uses pipeStreamData (returns false on failure) instead of getStreamData
// (throws) — WASM is built without C++ exceptions, so a throw becomes abort()
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

// extract every embedded raster image from a PDF
// strategy:
//   "encoded"     — bytes are a complete JPEG/JPX
//   "raw-pixels"  — bytes are uncompressed pixels (caller encodes to PNG)
//   "unsupported" — raw filtered bytes (CCITT, JBIG2, ...)
//   "error"       — qpdf could not read the stream
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

        // promote inline images to XObjects so forEachImage picks them up
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
                        // generalized strips ASCII wrappers but leaves DCT/JPX intact
                        if (pipeImageData(image, qpdf_dl_generalized, buf) && buf) {
                            bytes = bufferToUint8Array(buf);
                            strategy = "encoded";
                        }
                    } else if (filter == "FlateDecode" || filter == "LZWDecode"
                               || filter == "RunLengthDecode" || filter == "none") {
                        if (pipeImageData(image, qpdf_dl_specialized, buf) && buf) {
                            bytes = bufferToUint8Array(buf);
                            strategy = "raw-pixels";
                        }
                    } else {
                        // CCITTFax, JBIG2, etc. — surface raw bytes for caller fallback
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
