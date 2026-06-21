#include "qpdf_engine.h"

#include <qpdf/Buffer.hh>
#include <qpdf/Constants.h>
#include <qpdf/Pl_Buffer.hh>
#include <qpdf/Pl_Flate.hh>
#include <qpdf/QPDF.hh>
#include <qpdf/QPDFObjectHandle.hh>
#include <qpdf/QPDFPageDocumentHelper.hh>
#include <qpdf/QPDFPageObjectHelper.hh>
#include <qpdf/QPDFWriter.hh>

#include <algorithm>
#include <memory>
#include <set>
#include <stdexcept>
#include <string>
#include <vector>

#include <qpdf/QPDFObjGen.hh>

namespace giovanni {

// ---------------------------------------------------------------------------
// File-local helpers
// ---------------------------------------------------------------------------

static qpdf_stream_decode_level_e resolveDecodeLevel(const std::string& level) {
    if (level == "none")        return qpdf_dl_none;
    if (level == "generalized") return qpdf_dl_generalized;
    if (level == "specialized") return qpdf_dl_specialized;
    if (level == "all")         return qpdf_dl_all;
    throw std::runtime_error("Invalid decodeLevel: " + level);
}

static qpdf_object_stream_e resolveObjectStreamMode(const std::string& mode) {
    if (mode == "disable")  return qpdf_o_disable;
    if (mode == "preserve") return qpdf_o_preserve;
    if (mode == "generate") return qpdf_o_generate;
    throw std::runtime_error("Invalid objectStreams: " + mode);
}

static std::vector<uint8_t> bufferToVec(const std::shared_ptr<Buffer>& buf) {
    const unsigned char* data = buf->getBuffer();
    return std::vector<uint8_t>(data, data + buf->getSize());
}

static std::string stripSlash(const std::string& name) {
    return (!name.empty() && name[0] == '/') ? name.substr(1) : name;
}

static bool isAsciiWrapper(const std::string& f) {
    return f == "ASCII85Decode" || f == "ASCIIHexDecode";
}

static std::vector<std::string> getFilters(QPDFObjectHandle& dict) {
    QPDFObjectHandle fObj = dict.getKey("/Filter");
    if (fObj.isNull()) return {};
    if (fObj.isName()) return { stripSlash(fObj.getName()) };
    std::vector<std::string> result;
    if (fObj.isArray()) {
        for (int i = 0; i < fObj.getArrayNItems(); ++i) {
            auto item = fObj.getArrayItem(i);
            if (item.isName()) result.push_back(stripSlash(item.getName()));
        }
    }
    return result;
}

static std::string leafFilter(QPDFObjectHandle& dict) {
    auto filters = getFilters(dict);
    for (auto it = filters.rbegin(); it != filters.rend(); ++it) {
        if (!isAsciiWrapper(*it)) return *it;
    }
    return filters.empty() ? "none" : filters.front();
}

static int resolveComponents(QPDFObjectHandle& dict) {
    QPDFObjectHandle cs = dict.getKey("/ColorSpace");
    if (cs.isNull()) {
        QPDFObjectHandle im = dict.getKey("/ImageMask");
        return (im.isBool() && im.getBoolValue()) ? 1 : 0;
    }
    std::string name = cs.isName() ? stripSlash(cs.getName()) : "";
    if (name == "DeviceGray" || name == "CalGray")               return 1;
    if (name == "DeviceRGB"  || name == "CalRGB" || name == "Lab") return 3;
    if (name == "DeviceCMYK")                                    return 4;
    if (cs.isArray() && cs.getArrayNItems() > 0) {
        QPDFObjectHandle first = cs.getArrayItem(0);
        if (first.isName()) {
            std::string aname = stripSlash(first.getName());
            if (aname == "ICCBased" && cs.getArrayNItems() >= 2) {
                QPDFObjectHandle stream = cs.getArrayItem(1);
                if (stream.isStream()) {
                    QPDFObjectHandle n = stream.getDict().getKey("/N");
                    if (n.isInteger()) return static_cast<int>(n.getIntValue());
                }
            }
            if (aname == "Indexed" || aname == "Separation") return 1;
        }
    }
    return 0;
}

static std::string resolvePixelColorModel(int components) {
    switch (components) {
        case 1:  return "gray";
        case 3:  return "rgb";
        case 4:  return "cmyk";
        default: return "unknown";
    }
}

// ---------------------------------------------------------------------------
// QpdfEngine::getVersion
// ---------------------------------------------------------------------------

std::string QpdfEngine::getVersion() {
    return QPDF::QPDFVersion();
}

// ---------------------------------------------------------------------------
// QpdfEngine::writePdf
// ---------------------------------------------------------------------------

std::vector<uint8_t> QpdfEngine::writePdf(
    const std::vector<uint8_t>& input,
    const WriteOptions& options,
    const std::string& password)
{
    try {
        if (options.compressionLevel >= 1 && options.compressionLevel <= 9) {
            Pl_Flate::setCompressionLevel(options.compressionLevel);
        }

        QPDF pdf;
        pdf.processMemoryFile(
            "input.pdf",
            reinterpret_cast<const char*>(input.data()),
            input.size(),
            password.empty() ? nullptr : password.c_str());

        if (options.compressPages) {
            auto allPages = pdf.getAllPages();
            for (auto& page : allPages) {
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
        writer.setDecodeLevel(resolveDecodeLevel(options.decodeLevel));
        writer.setObjectStreamMode(resolveObjectStreamMode(options.objectStreams));
        if (options.linearize) {
            writer.setLinearization(true);
        }
        writer.write();

        return bufferToVec(writer.getBufferSharedPointer());
    } catch (const std::exception& e) {
        throw std::runtime_error(std::string("writePdf failed: ") + e.what());
    }
}

// ---------------------------------------------------------------------------
// QpdfEngine::splitPages
// ---------------------------------------------------------------------------

std::vector<std::vector<uint8_t>> QpdfEngine::splitPages(const std::vector<uint8_t>& input) {
    try {
        QPDF pdf;
        pdf.processMemoryFile(
            "input.pdf",
            reinterpret_cast<const char*>(input.data()),
            input.size());

        std::vector<std::vector<uint8_t>> result;
        for (auto& page : pdf.getAllPages()) {
            QPDF outPdf;
            outPdf.emptyPDF();
            outPdf.addPage(page, false);

            QPDFWriter writer(outPdf);
            writer.setOutputMemory();
            writer.setObjectStreamMode(qpdf_o_generate);
            writer.write();

            result.push_back(bufferToVec(writer.getBufferSharedPointer()));
        }
        return result;
    } catch (const std::exception& e) {
        throw std::runtime_error(std::string("splitPages failed: ") + e.what());
    }
}

// ---------------------------------------------------------------------------
// QpdfEngine::mergePdfs
// ---------------------------------------------------------------------------

std::vector<uint8_t> QpdfEngine::mergePdfs(const std::vector<std::vector<uint8_t>>& inputs) {
    if (inputs.empty()) {
        throw std::runtime_error("mergePdfs: at least one PDF is required");
    }
    try {
        QPDF outPdf;
        outPdf.emptyPDF();

        std::vector<std::unique_ptr<QPDF>> sources;
        sources.reserve(inputs.size());

        for (size_t i = 0; i < inputs.size(); ++i) {
            const auto& data = inputs[i];
            auto src = std::make_unique<QPDF>();
            std::string name = "input-" + std::to_string(i) + ".pdf";
            src->processMemoryFile(
                name.c_str(),
                reinterpret_cast<const char*>(data.data()),
                data.size());
            for (auto& page : src->getAllPages()) {
                outPdf.addPage(page, false);
            }
            sources.push_back(std::move(src));
        }

        QPDFWriter writer(outPdf);
        writer.setOutputMemory();
        writer.setObjectStreamMode(qpdf_o_generate);
        writer.write();

        return bufferToVec(writer.getBufferSharedPointer());
    } catch (const std::exception& e) {
        throw std::runtime_error(std::string("mergePdfs failed: ") + e.what());
    }
}

// ---------------------------------------------------------------------------
// QpdfEngine::getDocumentInfo
// ---------------------------------------------------------------------------

DocumentInfo QpdfEngine::getDocumentInfo(
    const std::vector<uint8_t>& input,
    const std::string& password)
{
    try {
        QPDF pdf;
        pdf.processMemoryFile(
            "input.pdf",
            reinterpret_cast<const char*>(input.data()),
            input.size(),
            password.empty() ? nullptr : password.c_str());

        DocumentInfo info;
        info.numPages     = static_cast<int>(pdf.getAllPages().size());
        info.pdfVersion   = pdf.getPDFVersion();
        info.isEncrypted  = pdf.isEncrypted();
        info.isLinearized = pdf.isLinearized();

        auto tryMeta = [&](const std::string& key) -> std::optional<std::string> {
            QPDFObjectHandle infoDict = pdf.getTrailer().getKey("/Info");
            if (!infoDict.isDictionary()) return std::nullopt;
            QPDFObjectHandle val = infoDict.getKey(key);
            if (!val.isString()) return std::nullopt;
            std::string s = val.getUTF8Value();
            return s.empty() ? std::nullopt : std::make_optional(s);
        };

        info.title   = tryMeta("/Title");
        info.author  = tryMeta("/Author");
        info.subject = tryMeta("/Subject");
        info.creator = tryMeta("/Creator");

        return info;
    } catch (const std::exception& e) {
        throw std::runtime_error(std::string("getDocumentInfo failed: ") + e.what());
    }
}

// ---------------------------------------------------------------------------
// QpdfEngine::extractImages -- helpers
// ---------------------------------------------------------------------------

static bool isSafeImageWrapper(const std::string& filter) {
    return isAsciiWrapper(filter)
        || filter == "FlateDecode"
        || filter == "LZWDecode"
        || filter == "RunLengthDecode";
}

static std::string getColorSpaceString(QPDFObjectHandle& dict) {
    QPDFObjectHandle cs = dict.getKey("/ColorSpace");
    if (cs.isNull()) return "";
    if (cs.isName()) return cs.getName();
    return cs.unparse();
}

static bool pipeImageData(QPDFObjectHandle& image,
                           qpdf_stream_decode_level_e level,
                           std::vector<uint8_t>& outBytes) {
    Pl_Buffer pipeline("image-buffer");
    bool filteringAttempted = false;
    bool ok = image.pipeStreamData(&pipeline, &filteringAttempted, 0, level, true, false);
    if (!ok) return false;
    auto buf = pipeline.getBufferSharedPointer();
    if (!buf) return false;
    outBytes = bufferToVec(buf);
    return true;
}

class ScopedStreamFilterOverride {
public:
    ScopedStreamFilterOverride(QPDFObjectHandle& d,
                               QPDFObjectHandle origFilter,
                               QPDFObjectHandle origDecodeParms,
                               bool hadDecodeParms)
        : dict(d), originalFilter(origFilter),
          originalDecodeParms(origDecodeParms), hadDP(hadDecodeParms) {}
    ~ScopedStreamFilterOverride() { restore(); }
    ScopedStreamFilterOverride(const ScopedStreamFilterOverride&) = delete;
    ScopedStreamFilterOverride& operator=(const ScopedStreamFilterOverride&) = delete;
private:
    void restore() {
        if (restored) return;
        dict.replaceKey("/Filter", originalFilter);
        if (hadDP) dict.replaceKey("/DecodeParms", originalDecodeParms);
        else dict.removeKey("/DecodeParms");
        restored = true;
    }
    QPDFObjectHandle& dict;
    QPDFObjectHandle originalFilter, originalDecodeParms;
    bool hadDP;
    bool restored = false;
};

static QPDFObjectHandle makeFilterObj(const std::vector<std::string>& filters) {
    if (filters.size() == 1) return QPDFObjectHandle::newName("/" + filters[0]);
    QPDFObjectHandle arr = QPDFObjectHandle::newArray();
    for (const auto& f : filters) arr.appendItem(QPDFObjectHandle::newName("/" + f));
    return arr;
}

static QPDFObjectHandle getPrefixDecodeParms(QPDFObjectHandle& dp, size_t n) {
    if (dp.isNull()) return QPDFObjectHandle::newNull();
    if (!dp.isArray()) return dp;
    QPDFObjectHandle result = QPDFObjectHandle::newArray();
    size_t count = std::min(n, static_cast<size_t>(dp.getArrayNItems()));
    for (size_t i = 0; i < count; ++i) result.appendItem(dp.getArrayItem(static_cast<int>(i)));
    return result;
}

// Strips safe prefix filters (ASCII/Flate/LZW wrappers) before piping so
// that DCT/JPX bytes are preserved intact without re-decoding them.
static bool pipeEncodedImageData(QPDFObjectHandle& image,
                                  QPDFObjectHandle& dict,
                                  std::vector<uint8_t>& outBytes) {
    auto filters = getFilters(dict);
    if (filters.empty()) return pipeImageData(image, qpdf_dl_none, outBytes);

    int leafIdx = -1;
    for (int i = static_cast<int>(filters.size()) - 1; i >= 0; --i) {
        if (!isAsciiWrapper(filters[static_cast<size_t>(i)])) { leafIdx = i; break; }
    }
    if (leafIdx <= 0) return pipeImageData(image, qpdf_dl_none, outBytes);

    size_t prefixCount = static_cast<size_t>(leafIdx);
    std::vector<std::string> prefixFilters(filters.begin(), filters.begin() + leafIdx);
    if (!std::all_of(prefixFilters.begin(), prefixFilters.end(), isSafeImageWrapper))
        return false;

    QPDFObjectHandle origFilter = dict.getKey("/Filter");
    bool hadDP = dict.hasKey("/DecodeParms");
    QPDFObjectHandle origDP    = dict.getKey("/DecodeParms");
    ScopedStreamFilterOverride restore(dict, origFilter, origDP, hadDP);

    QPDFObjectHandle prefixDP = getPrefixDecodeParms(origDP, prefixCount);
    dict.replaceKey("/Filter", makeFilterObj(prefixFilters));
    if (prefixDP.isNull()) dict.removeKey("/DecodeParms");
    else dict.replaceKey("/DecodeParms", prefixDP);

    return pipeImageData(image, qpdf_dl_specialized, outBytes);
}

// ---------------------------------------------------------------------------
// QpdfEngine::extractImages
// ---------------------------------------------------------------------------

std::vector<ExtractedImage> QpdfEngine::extractImages(const std::vector<uint8_t>& input) {
    try {
        QPDF pdf;
        pdf.processMemoryFile(
            "input.pdf",
            reinterpret_cast<const char*>(input.data()),
            input.size());

        std::vector<ExtractedImage> results;
        std::set<std::string> seen;

        // Wrap in document helper to access page helpers
        auto pages = QPDFPageDocumentHelper(pdf).getAllPages();

        // Externalize inline images so they appear as regular XObjects
        for (auto& page : pages) {
            try { page.externalizeInlineImages(); } catch (...) {}
        }

        for (int pageIdx = 0; pageIdx < static_cast<int>(pages.size()); ++pageIdx) {
            pages[static_cast<size_t>(pageIdx)].forEachImage(
                /*recursive=*/true,
                [&](QPDFObjectHandle& image,
                    QPDFObjectHandle& /*xobjDict*/,
                    const std::string& key) {
                    try {
                        QPDFObjGen og = image.getObjGen();
                        std::string ogKey =
                            std::to_string(og.getObj()) + "/" + std::to_string(og.getGen());
                        if (!seen.insert(ogKey).second) return;

                        QPDFObjectHandle dict = image.getDict();

                        auto intKey = [&](const std::string& k) -> int {
                            QPDFObjectHandle v = dict.getKey(k);
                            return v.isInteger() ? static_cast<int>(v.getIntValue()) : 0;
                        };

                        ExtractedImage img;
                        img.objectKey    = ogKey;
                        img.xobjectKey   = key;
                        img.pageIndex    = pageIdx;
                        img.filter       = leafFilter(dict);
                        img.width        = intKey("/Width");
                        img.height       = intKey("/Height");
                        img.bitsPerComponent = intKey("/BitsPerComponent");
                        img.colorSpace       = getColorSpaceString(dict);
                        img.components       = resolveComponents(dict);
                        img.pixelColorModel  = resolvePixelColorModel(img.components);
                        img.hasMask    = !dict.getKey("/Mask").isNull();
                        img.hasSMask   = !dict.getKey("/SMask").isNull();
                        QPDFObjectHandle imObj = dict.getKey("/ImageMask");
                        img.isImageMask = imObj.isBool() && imObj.getBoolValue();

                        bool isJpeg = (img.filter == "DCTDecode" || img.filter == "JPXDecode");
                        bool isFlate = (img.filter == "FlateDecode"
                                        || img.filter == "LZWDecode"
                                        || img.filter == "RunLengthDecode"
                                        || img.filter == "none");

                        if (isJpeg) {
                            if (pipeEncodedImageData(image, dict, img.bytes))
                                img.strategy = "encoded";
                        } else if (isFlate) {
                            if (pipeImageData(image, qpdf_dl_specialized, img.bytes))
                                img.strategy = "raw-pixels";
                        } else {
                            // CCITTFax, JBIG2, etc. -- surface raw bytes for caller fallback
                            if (pipeImageData(image, qpdf_dl_none, img.bytes))
                                img.strategy = "unsupported";
                        }

                        results.push_back(std::move(img));
                    } catch (...) {
                        // skip images that cause qpdf exceptions
                    }
                });
        }

        return results;
    } catch (const std::exception& e) {
        throw std::runtime_error(std::string("extractImages failed: ") + e.what());
    }
}

} // namespace giovanni
