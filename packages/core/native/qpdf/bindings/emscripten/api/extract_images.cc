// Thin wrapper — marshals JS types and delegates to QpdfEngine::extractImages.
// The full extraction logic (forEachImage, externalizeInlineImages, JPEG
// prefix-filter stripping) lives in QpdfEngine to keep it reusable across
// all build targets.

#include "../qpdf_wasm.hh"
#include "qpdf_engine.h"
#include <stdexcept>

emscripten::val extractImages(const emscripten::val& inputArray) {
    try {
        std::vector<uint8_t> input = emscripten::vecFromJSArray<uint8_t>(inputArray);
        auto images = getEngine().extractImages(input);

        emscripten::val result = emscripten::val::array();
        for (const auto& img : images) {
            emscripten::val info = emscripten::val::object();
            info.set("objectKey",        img.objectKey);
            info.set("xobjectKey",       img.xobjectKey);
            info.set("pageIndex",        img.pageIndex);
            info.set("filter",           img.filter);
            info.set("width",            img.width);
            info.set("height",           img.height);
            info.set("bitsPerComponent", img.bitsPerComponent);
            info.set("colorSpace",       img.colorSpace);
            info.set("components",       img.components);
            info.set("pixelColorModel",  img.pixelColorModel);
            info.set("hasMask",          img.hasMask);
            info.set("hasSMask",         img.hasSMask);
            info.set("isImageMask",      img.isImageMask);
            info.set("strategy",         img.strategy);
            info.set("bytes",            vecToUint8Array(img.bytes));
            result.call<void>("push", info);
        }
        return result;
    } catch (const std::exception& e) {
        throw std::runtime_error(std::string("PDF image extraction failed: ") + e.what());
    }
}
