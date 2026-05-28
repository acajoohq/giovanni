// qpdf_jsi.cpp — React Native JSI adapter for QpdfEngine
//
// This adapter bridges the pdfly C++ interface (IQpdfEngine) to the
// React Native / Hermes JavaScript Interface (JSI).
//
// Compile with PDFLY_JSI_ENABLED=1 after providing:
//   1. jsi/jsi.h  (from react-native or hermes-engine)
//   2. The pdfly impl/ sources
//
// Registration: call pdfly::jsi::install(runtime) from your TurboModule's
// install() function, typically in the AppDelegate (iOS) or onCreate (Android).

#pragma once

#ifdef PDFLY_JSI_ENABLED

#include <jsi/jsi.h>

#include "../../../impl/qpdf/qpdf_engine.h"

#include <memory>
#include <string>
#include <vector>

namespace pdfly::jsi {

using namespace facebook::jsi;

// Convert a JSI Uint8Array / ArrayBuffer value to std::vector<uint8_t>
static std::vector<uint8_t> jsValueToBytes(Runtime& rt, const Value& val) {
    if (val.isObject()) {
        auto obj = val.asObject(rt);
        if (obj.isArrayBuffer(rt)) {
            auto ab = obj.getArrayBuffer(rt);
            const uint8_t* data = ab.data(rt);
            return std::vector<uint8_t>(data, data + ab.size(rt));
        }
        // TypedArray: read via .buffer
        Value bufVal = obj.getProperty(rt, "buffer");
        if (bufVal.isObject()) {
            auto ab = bufVal.asObject(rt).getArrayBuffer(rt);
            const uint8_t* data = ab.data(rt);
            return std::vector<uint8_t>(data, data + ab.size(rt));
        }
    }
    throw JSError(rt, "pdfly: expected Uint8Array or ArrayBuffer");
}

// Wrap a byte vector in a JSI ArrayBuffer (zero-copy via shared_ptr)
static Value bytesToJsValue(Runtime& rt, std::vector<uint8_t> bytes) {
    auto mutableData = std::make_shared<std::vector<uint8_t>>(std::move(bytes));
    auto ab = ArrayBuffer(rt, {
        mutableData->data(),
        mutableData->size(),
        [mutableData](uint8_t*) mutable { mutableData.reset(); }
    });
    return Object::createFromHostObject(rt, std::make_shared<ArrayBuffer>(std::move(ab)));
}

// ---------------------------------------------------------------------------
// install — registers all pdfly operations on the given JSI Runtime
// ---------------------------------------------------------------------------
//
// After calling this, the following globals are available in JS:
//
//   pdfly.getVersion()   → string
//   pdfly.writePdf(u8a, opts, password?) → Uint8Array
//   pdfly.splitPages(u8a)               → Uint8Array[]
//   pdfly.mergePdfs(u8a[])              → Uint8Array
//   pdfly.getDocumentInfo(u8a, pass?)   → object
//
// All functions are synchronous (JSI does not require Promises at this layer;
// wrap in a Promise in the JS TurboModule spec if async behaviour is needed).

inline void install(Runtime& rt, std::shared_ptr<IQpdfEngine> engine = nullptr) {
    if (!engine) {
        engine = std::make_shared<QpdfEngine>();
    }

    auto pdfly = Object(rt);

    // --- getVersion ---
    pdfly.setProperty(rt, "getVersion",
        Function::createFromHostFunction(rt,
            PropNameID::forAscii(rt, "getVersion"), 0,
            [engine](Runtime& rt, const Value&, const Value*, size_t) -> Value {
                return String::createFromUtf8(rt, engine->getVersion());
            }));

    // --- writePdf(u8a, opts, password?) ---
    pdfly.setProperty(rt, "writePdf",
        Function::createFromHostFunction(rt,
            PropNameID::forAscii(rt, "writePdf"), 3,
            [engine](Runtime& rt, const Value&, const Value* args, size_t count) -> Value {
                if (count < 1) throw JSError(rt, "pdfly.writePdf: expected (data, opts?, password?)");

                auto input = jsValueToBytes(rt, args[0]);

                pdfly::WriteOptions opts;
                if (count >= 2 && args[1].isObject()) {
                    auto o = args[1].asObject(rt);
                    auto getInt = [&](const char* k, int def) -> int {
                        Value v = o.getProperty(rt, k);
                        return v.isNumber() ? static_cast<int>(v.asNumber()) : def;
                    };
                    auto getBool = [&](const char* k, bool def) -> bool {
                        Value v = o.getProperty(rt, k);
                        return v.isBool() ? v.asBool() : def;
                    };
                    auto getStr = [&](const char* k, const std::string& def) -> std::string {
                        Value v = o.getProperty(rt, k);
                        return v.isString() ? v.asString(rt).utf8(rt) : def;
                    };
                    opts.compressionLevel           = getInt("compressionLevel", 6);
                    opts.recompressFlate            = getBool("recompressFlate", true);
                    opts.decodeLevel                = getStr("decodeLevel", "generalized");
                    opts.objectStreams               = getStr("objectStreams", "generate");
                    opts.compressPages              = getBool("compressPages", false);
                    opts.removeUnreferencedResources = getBool("removeUnreferencedResources", false);
                    opts.linearize                  = getBool("linearize", false);
                }

                std::string password;
                if (count >= 3 && args[2].isString()) {
                    password = args[2].asString(rt).utf8(rt);
                }

                auto result = engine->writePdf(input, opts, password);
                return bytesToJsValue(rt, std::move(result));
            }));

    // --- splitPages(u8a) → ArrayBuffer[] ---
    pdfly.setProperty(rt, "splitPages",
        Function::createFromHostFunction(rt,
            PropNameID::forAscii(rt, "splitPages"), 1,
            [engine](Runtime& rt, const Value&, const Value* args, size_t count) -> Value {
                if (count < 1) throw JSError(rt, "pdfly.splitPages: expected (data)");
                auto input = jsValueToBytes(rt, args[0]);
                auto pages = engine->splitPages(input);

                Array arr(rt, pages.size());
                for (size_t i = 0; i < pages.size(); ++i) {
                    arr.setValueAtIndex(rt, i, bytesToJsValue(rt, std::move(pages[i])));
                }
                return arr;
            }));

    // --- mergePdfs(u8a[]) → ArrayBuffer ---
    pdfly.setProperty(rt, "mergePdfs",
        Function::createFromHostFunction(rt,
            PropNameID::forAscii(rt, "mergePdfs"), 1,
            [engine](Runtime& rt, const Value&, const Value* args, size_t count) -> Value {
                if (count < 1) throw JSError(rt, "pdfly.mergePdfs: expected (inputs[])");
                auto arr = args[0].asObject(rt).asArray(rt);
                size_t n = arr.size(rt);

                std::vector<std::vector<uint8_t>> inputs;
                inputs.reserve(n);
                for (size_t i = 0; i < n; ++i) {
                    inputs.push_back(jsValueToBytes(rt, arr.getValueAtIndex(rt, i)));
                }

                auto result = engine->mergePdfs(inputs);
                return bytesToJsValue(rt, std::move(result));
            }));

    // --- getDocumentInfo(u8a, password?) → object ---
    pdfly.setProperty(rt, "getDocumentInfo",
        Function::createFromHostFunction(rt,
            PropNameID::forAscii(rt, "getDocumentInfo"), 2,
            [engine](Runtime& rt, const Value&, const Value* args, size_t count) -> Value {
                if (count < 1) throw JSError(rt, "pdfly.getDocumentInfo: expected (data, password?)");
                auto input = jsValueToBytes(rt, args[0]);
                std::string password;
                if (count >= 2 && args[1].isString()) password = args[1].asString(rt).utf8(rt);

                auto info = engine->getDocumentInfo(input, password);

                Object result(rt);
                result.setProperty(rt, "numPages",     Value(static_cast<double>(info.numPages)));
                result.setProperty(rt, "pdfVersion",   String::createFromUtf8(rt, info.pdfVersion));
                result.setProperty(rt, "isEncrypted",  Value(info.isEncrypted));
                result.setProperty(rt, "isLinearized", Value(info.isLinearized));

                auto optStr = [&](const char* k, const std::optional<std::string>& v) {
                    if (v) result.setProperty(rt, k, String::createFromUtf8(rt, *v));
                    else   result.setProperty(rt, k, Value::undefined());
                };
                optStr("title",   info.title);
                optStr("author",  info.author);
                optStr("subject", info.subject);
                optStr("creator", info.creator);

                return result;
            }));


    // --- extractImages(u8a) -> object[] ---
    pdfly.setProperty(rt, "extractImages",
        Function::createFromHostFunction(rt,
            PropNameID::forAscii(rt, "extractImages"), 1,
            [engine](Runtime& rt, const Value&, const Value* args, size_t count) -> Value {
                if (count < 1) throw JSError(rt, "pdfly.extractImages: expected (data)");
                auto input = jsValueToBytes(rt, args[0]);
                auto images = engine->extractImages(input);

                Array arr(rt, images.size());
                for (size_t i = 0; i < images.size(); ++i) {
                    const auto& img = images[i];
                    Object obj(rt);
                    obj.setProperty(rt, "objectKey",        String::createFromUtf8(rt, img.objectKey));
                    obj.setProperty(rt, "xobjectKey",       String::createFromUtf8(rt, img.xobjectKey));
                    obj.setProperty(rt, "pageIndex",        Value(static_cast<double>(img.pageIndex)));
                    obj.setProperty(rt, "filter",           String::createFromUtf8(rt, img.filter));
                    obj.setProperty(rt, "width",            Value(static_cast<double>(img.width)));
                    obj.setProperty(rt, "height",           Value(static_cast<double>(img.height)));
                    obj.setProperty(rt, "bitsPerComponent", Value(static_cast<double>(img.bitsPerComponent)));
                    obj.setProperty(rt, "colorSpace",       String::createFromUtf8(rt, img.colorSpace));
                    obj.setProperty(rt, "components",       Value(static_cast<double>(img.components)));
                    obj.setProperty(rt, "pixelColorModel",  String::createFromUtf8(rt, img.pixelColorModel));
                    obj.setProperty(rt, "hasMask",          Value(img.hasMask));
                    obj.setProperty(rt, "hasSMask",         Value(img.hasSMask));
                    obj.setProperty(rt, "isImageMask",      Value(img.isImageMask));
                    obj.setProperty(rt, "strategy",         String::createFromUtf8(rt, img.strategy));
                    obj.setProperty(rt, "bytes",            bytesToJsValue(rt, img.bytes));
                    arr.setValueAtIndex(rt, i, std::move(obj));
                }
                return arr;
            }));
    rt.global().setProperty(rt, "pdfly", std::move(pdfly));
}

} // namespace pdfly::jsi

#endif // PDFLY_JSI_ENABLED
