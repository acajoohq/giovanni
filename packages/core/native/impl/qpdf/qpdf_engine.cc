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

#include <memory>
#include <set>
#include <stdexcept>
#include <string>
#include <vector>

namespace pdfly {

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
        std::set<QPDFObjGen> seen;

        auto pages = pdf.getAllPages();
        for (int pageIdx = 0; pageIdx < static_cast<int>(pages.size()); ++pageIdx) {
            QPDFPageObjectHelper pageHelper(pages[static_cast<size_t>(pageIdx)]);

            for (auto& [xobjKey, imageHandle] : pageHelper.getImages()) {
                QPDFObjGen og = imageHandle.getObjGen();
                if (!seen.insert(og).second) continue;

                ExtractedImage img;
                img.objectKey  = std::to_string(og.getObj()) + "/" + std::to_string(og.getGen());
                img.xobjectKey = xobjKey;
                img.pageIndex  = pageIdx;

                QPDFObjectHandle dict = imageHandle.getDict();

                auto intKey = [&](const std::string& k) -> int {
                    QPDFObjectHandle v = dict.getKey(k);
                    return v.isInteger() ? static_cast<int>(v.getIntValue()) : 0;
                };

                img.width            = intKey("/Width");
                img.height           = intKey("/Height");
                img.bitsPerComponent = intKey("/BitsPerComponent");

                QPDFObjectHandle csObj = dict.getKey("/ColorSpace");
                img.colorSpace = csObj.isNull() ? ""
                               : csObj.isName() ? stripSlash(csObj.getName())
                               : csObj.unparse();

                img.components      = resolveComponents(dict);
                img.pixelColorModel = resolvePixelColorModel(img.components);

                img.hasMask     = !dict.getKey("/Mask").isNull();
                img.hasSMask    = !dict.getKey("/SMask").isNull();
                QPDFObjectHandle imObj = dict.getKey("/ImageMask");
                img.isImageMask = imObj.isBool() && imObj.getBoolValue();

                img.filter = leafFilter(dict);

                bool isJpeg = (img.filter == "DCTDecode" || img.filter == "JPXDecode");
                bool isRaw  = (img.filter == "none" || img.filter.empty());

                try {
                    if (isJpeg || isRaw) {
                        Pl_Buffer collector("image-bytes");
                        imageHandle.pipeStreamData(
                            &collector,
                            isJpeg ? qpdf_ef_compress : 0,
                            qpdf_dl_none);
                        collector.finish();
                        img.bytes    = bufferToVec(collector.getBufferSharedPointer());
                        img.strategy = isJpeg ? "encoded" : "raw-pixels";
                    } else if (img.components > 0) {
                        Pl_Buffer collector("image-pixels");
                        imageHandle.pipeStreamData(&collector, 0, qpdf_dl_all);
                        collector.finish();
                        img.bytes    = bufferToVec(collector.getBufferSharedPointer());
                        img.strategy = "raw-pixels";
                    } else {
                        img.strategy = "unsupported";
                    }
                } catch (...) {
                    img.strategy = "error";
                }

                results.push_back(std::move(img));
            }
        }

        return results;
    } catch (const std::exception& e) {
        throw std::runtime_error(std::string("extractImages failed: ") + e.what());
    }
}

} // namespace pdfly
