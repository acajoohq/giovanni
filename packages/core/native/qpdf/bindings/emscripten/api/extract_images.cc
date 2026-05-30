// image extraction: walks pages, gathers image XObjects, returns metadata + bytes
// per-filter strategy is chosen so the browser does the actual pixel decoding

#include "../qpdf_wasm.hh"
#include <qpdf/QPDFObjectHandle.hh>
#include <qpdf/QPDFObjGen.hh>
#include <qpdf/QPDFPageDocumentHelper.hh>
#include <qpdf/QPDFPageObjectHelper.hh>
#include <qpdf/Pl_Buffer.hh>
#include <algorithm>
#include <set>
#include <stdexcept>

static std::string stripLeadingSlash(const std::string& name) {
    if (!name.empty() && name[0] == '/') {
        return name.substr(1);
    }

    return name;
}

static bool isAsciiWrapper(const std::string& filter) {
    return filter == "ASCII85Decode" || filter == "ASCIIHexDecode";
}

static bool isSafeImageWrapper(const std::string& filter) {
    return isAsciiWrapper(filter) || filter == "FlateDecode" || filter == "LZWDecode" || filter == "RunLengthDecode";
}

static std::vector<std::string> getFilterNames(QPDFObjectHandle& streamDict) {
    QPDFObjectHandle filterObj = streamDict.getKey("/Filter");
    std::vector<std::string> filters;

    if (filterObj.isNull()) {
        return filters;
    }
    if (filterObj.isName()) {
        filters.push_back(stripLeadingSlash(filterObj.getName()));

        return filters;
    }
    if (filterObj.isArray()) {
        int n = filterObj.getArrayNItems();
        filters.reserve(static_cast<size_t>(n));
        for (int i = 0; i < n; i++) {
            QPDFObjectHandle item = filterObj.getArrayItem(i);
            if (item.isName()) {
                filters.push_back(stripLeadingSlash(item.getName()));
            }
        }
    }

    return filters;
}

// the leaf filter (last non-ASCII entry) determines whether raw bytes are a
// complete JPEG/JPX, raw pixels, or something else
static std::string getLeafImageFilter(QPDFObjectHandle& streamDict) {
    std::vector<std::string> filters = getFilterNames(streamDict);
    if (filters.empty()) {
        return "none";
    }

    for (auto iter = filters.rbegin(); iter != filters.rend(); ++iter) {
        if (!isAsciiWrapper(*iter)) {
            return *iter;
        }
    }

    return "none";
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
// non-zero counts are only 1, 3, or 4 (no 2-component spaces on this path)
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

// raw pixel interpretation supported by the TS canvas encoder
static std::string getPixelColorModel(QPDFObjectHandle& streamDict) {
    QPDFObjectHandle cs = streamDict.getKey("/ColorSpace");
    if (cs.isNull()) {
        // image masks have no /ColorSpace and are 1-bit single-channel
        QPDFObjectHandle imObj = streamDict.getKey("/ImageMask");
        if (imObj.isBool() && imObj.getBoolValue()) {
            return "gray";
        }

        return "unknown";
    }

    if (cs.isName()) {
        std::string name = stripLeadingSlash(cs.getName());
        if (name == "DeviceGray" || name == "G" || name == "CalGray") return "gray";
        if (name == "DeviceRGB" || name == "RGB" || name == "CalRGB") return "rgb";
        if (name == "DeviceCMYK" || name == "CMYK") return "cmyk";

        return "unknown";
    }

    if (cs.isArray() && cs.getArrayNItems() > 0) {
        QPDFObjectHandle head = cs.getArrayItem(0);
        if (!head.isName()) return "unknown";
        std::string family = stripLeadingSlash(head.getName());

        if (family == "ICCBased" && cs.getArrayNItems() > 1) {
            QPDFObjectHandle profile = cs.getArrayItem(1);
            if (profile.isStream()) {
                QPDFObjectHandle profileDict = profile.getDict();
                QPDFObjectHandle nObj = profileDict.getKey("/N");
                if (nObj.isInteger()) {
                    int n = static_cast<int>(nObj.getIntValue());
                    if (n == 1) return "gray";
                    if (n == 3) return "rgb";
                    if (n == 4) return "cmyk";
                }
            }

            return "unknown";
        }

        if (family == "CalGray") return "gray";
        if (family == "CalRGB") return "rgb";

        // Lab, Indexed, Pattern, Separation, DeviceN — unsupported for v1
        return "unknown";
    }

    return "unknown";
}

// pipe stream data into a buffer at the given decode level
// uses pipeStreamData (returns false on failure) instead of getStreamData (throws)
// so decode/pipe failures are handled as a bool, not via qpdf exceptions on this path
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

class ScopedStreamFilterOverride {
public:
    ScopedStreamFilterOverride(QPDFObjectHandle& streamDict,
                               QPDFObjectHandle originalFilterValue,
                               QPDFObjectHandle originalDecodeParmsValue,
                               bool hadDecodeParmsValue) :
        dict(streamDict),
        originalFilter(originalFilterValue),
        originalDecodeParms(originalDecodeParmsValue),
        hadDecodeParms(hadDecodeParmsValue) {
    }

    ~ScopedStreamFilterOverride() {
        restore();
    }

    ScopedStreamFilterOverride(const ScopedStreamFilterOverride&) = delete;
    ScopedStreamFilterOverride& operator=(const ScopedStreamFilterOverride&) = delete;

private:
    void restore() {
        if (isRestored) {
            return;
        }

        dict.replaceKey("/Filter", originalFilter);
        if (hadDecodeParms) {
            dict.replaceKey("/DecodeParms", originalDecodeParms);
        } else {
            dict.removeKey("/DecodeParms");
        }

        isRestored = true;
    }

    QPDFObjectHandle& dict;
    QPDFObjectHandle originalFilter;
    QPDFObjectHandle originalDecodeParms;
    bool hadDecodeParms;
    bool isRestored = false;
};

static QPDFObjectHandle makeFilterObject(const std::vector<std::string>& filters) {
    if (filters.size() == 1) {
        return QPDFObjectHandle::newName("/" + filters[0]);
    }

    QPDFObjectHandle filterArray = QPDFObjectHandle::newArray();
    for (const auto& filter : filters) {
        filterArray.appendItem(QPDFObjectHandle::newName("/" + filter));
    }

    return filterArray;
}

static QPDFObjectHandle getPrefixDecodeParms(QPDFObjectHandle& decodeParms, size_t prefixCount) {
    if (decodeParms.isNull()) {
        return QPDFObjectHandle::newNull();
    }
    if (!decodeParms.isArray()) {
        return decodeParms;
    }

    QPDFObjectHandle prefixDecodeParms = QPDFObjectHandle::newArray();
    size_t itemCount = std::min(prefixCount, static_cast<size_t>(decodeParms.getArrayNItems()));
    for (size_t index = 0; index < itemCount; index++) {
        prefixDecodeParms.appendItem(decodeParms.getArrayItem(index));
    }

    return prefixDecodeParms;
}

static void applyDecodeParms(QPDFObjectHandle& dict, QPDFObjectHandle& decodeParms) {
    if (decodeParms.isNull()) {
        dict.removeKey("/DecodeParms");

        return;
    }

    dict.replaceKey("/DecodeParms", decodeParms);
}

static int findLeafFilterIndex(const std::vector<std::string>& filters) {
    for (int index = static_cast<int>(filters.size()) - 1; index >= 0; index--) {
        if (!isAsciiWrapper(filters[static_cast<size_t>(index)])) {
            return index;
        }
    }

    return -1;
}

static bool pipeEncodedImageData(QPDFObjectHandle& image,
                                 QPDFObjectHandle& dict,
                                 std::shared_ptr<Buffer>& outBuf) {
    std::vector<std::string> filters = getFilterNames(dict);
    if (filters.empty()) {
        return pipeImageData(image, qpdf_dl_none, outBuf);
    }

    int leafIndex = findLeafFilterIndex(filters);
    if (leafIndex <= 0) {
        return pipeImageData(image, qpdf_dl_none, outBuf);
    }

    size_t prefixCount = static_cast<size_t>(leafIndex);
    std::vector<std::string> prefixFilters(filters.begin(), filters.begin() + leafIndex);
    if (!std::all_of(prefixFilters.begin(), prefixFilters.end(), isSafeImageWrapper)) {
        return false;
    }

    QPDFObjectHandle originalFilter = dict.getKey("/Filter");
    bool hadDecodeParms = dict.hasKey("/DecodeParms");
    QPDFObjectHandle originalDecodeParms = dict.getKey("/DecodeParms");
    ScopedStreamFilterOverride restoreFilters(dict, originalFilter, originalDecodeParms, hadDecodeParms);

    QPDFObjectHandle prefixDecodeParms = getPrefixDecodeParms(originalDecodeParms, prefixCount);

    dict.replaceKey("/Filter", makeFilterObject(prefixFilters));
    applyDecodeParms(dict, prefixDecodeParms);

    return pipeImageData(image, qpdf_dl_specialized, outBuf);
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
            try {
                page.externalizeInlineImages();
            } catch (...) {
                // ignore pages whose inline images cannot be externalized
            }
        }

        for (size_t pageIndex = 0; pageIndex < pages.size(); pageIndex++) {
            int pageIndexInt = static_cast<int>(pageIndex);

            pages[pageIndex].forEachImage(
                /* recursive */ true,
                [&](QPDFObjectHandle& image, QPDFObjectHandle& /*xobjDict*/, const std::string& key) {
                    try {
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
                    std::string pixelColorModel = getPixelColorModel(dict);
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
                        // decode safe prefix wrappers while preserving DCT/JPX bytes
                        if (pipeEncodedImageData(image, dict, buf) && buf) {
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
                    info.set("pixelColorModel", pixelColorModel);
                    info.set("hasMask", hasMask);
                    info.set("hasSMask", hasSMask);
                    info.set("isImageMask", isImageMask);
                    info.set("strategy", strategy);
                    info.set("bytes", bytes);

                    result.call<void>("push", info);
                    } catch (...) {
                        // skip images that cause qpdf exceptions
                    }
                });
        }

        return result;

    } catch (const std::exception& e) {
        std::string errorMsg = std::string("PDF image extraction failed: ") + e.what();
        throw std::runtime_error(errorMsg);
    }
}
