// gs_jsi.h — React Native JSI adapter for GhostscriptEngine
//
// This adapter bridges the giovanni C++ interface (IGhostscriptEngine) to the
// React Native / Hermes JavaScript Interface (JSI).
//
// Compile with GIOVANNI_JSI_ENABLED=1 after providing:
//   1. jsi/jsi.h  (from react-native or hermes-engine)
//   2. The giovanni impl/ghostscript sources
//
// Registration: call giovanni::jsi::installGs(runtime) from your TurboModule's
// install() function, typically in the AppDelegate (iOS) or onCreate (Android).

#pragma once

#ifdef GIOVANNI_JSI_ENABLED

#include <jsi/jsi.h>

#include "../../../impl/ghostscript/gs_engine.h"

#include <memory>
#include <string>
#include <vector>

namespace giovanni::jsi {

using namespace facebook::jsi;

// ---------------------------------------------------------------------------
// installGs — registers Ghostscript operations on the given JSI Runtime
// ---------------------------------------------------------------------------
//
// After calling this, the following globals are available in JS:
//
//   giovanni_gs.getVersion()                → string
//   giovanni_gs.rewritePdf(u8a, args[])     → Uint8Array
//
// All functions are synchronous.

inline void installGs(Runtime& rt, std::shared_ptr<IGhostscriptEngine> engine = nullptr) {
    if (!engine) {
        engine = std::make_shared<GhostscriptEngine>();
    }

    // Convert a JSI Uint8Array / ArrayBuffer value to std::vector<uint8_t>
    auto jsValueToBytes = [](Runtime& rt, const Value& val) -> std::vector<uint8_t> {
        if (val.isObject()) {
            auto obj = val.asObject(rt);
            if (obj.isArrayBuffer(rt)) {
                auto ab = obj.getArrayBuffer(rt);
                const uint8_t* data = ab.data(rt);
                return std::vector<uint8_t>(data, data + ab.size(rt));
            }
            Value bufVal = obj.getProperty(rt, "buffer");
            if (bufVal.isObject()) {
                auto ab = bufVal.asObject(rt).getArrayBuffer(rt);
                const uint8_t* data = ab.data(rt);
                return std::vector<uint8_t>(data, data + ab.size(rt));
            }
        }
        throw JSError(rt, "giovanni_gs: expected Uint8Array or ArrayBuffer");
    };

    // Wrap a byte vector in a JSI ArrayBuffer (zero-copy via shared_ptr)
    auto bytesToJsValue = [](Runtime& rt, std::vector<uint8_t> bytes) -> Value {
        auto mutableData = std::make_shared<std::vector<uint8_t>>(std::move(bytes));
        auto ab = ArrayBuffer(rt, {
            mutableData->data(),
            mutableData->size(),
            [mutableData](uint8_t*) mutable { mutableData.reset(); }
        });
        return Object::createFromHostObject(rt, std::make_shared<ArrayBuffer>(std::move(ab)));
    };

    auto gs = Object(rt);

    // --- getVersion ---
    gs.setProperty(rt, "getVersion",
        Function::createFromHostFunction(rt,
            PropNameID::forAscii(rt, "getVersion"), 0,
            [engine](Runtime& rt, const Value&, const Value*, size_t) -> Value {
                return String::createFromUtf8(rt, engine->getVersion());
            }));

    // --- rewritePdf(u8a, args[]) → ArrayBuffer ---
    gs.setProperty(rt, "rewritePdf",
        Function::createFromHostFunction(rt,
            PropNameID::forAscii(rt, "rewritePdf"), 2,
            [engine, jsValueToBytes, bytesToJsValue](Runtime& rt, const Value&, const Value* args, size_t count) -> Value {
                if (count < 2) throw JSError(rt, "giovanni_gs.rewritePdf: expected (data, args[])");

                auto input = jsValueToBytes(rt, args[0]);

                auto argsArr = args[1].asObject(rt).asArray(rt);
                size_t n = argsArr.size(rt);
                std::vector<std::string> gsArgs;
                gsArgs.reserve(n);
                for (size_t i = 0; i < n; ++i) {
                    Value av = argsArr.getValueAtIndex(rt, i);
                    if (!av.isString()) throw JSError(rt, "giovanni_gs.rewritePdf: args must be strings");
                    gsArgs.push_back(av.asString(rt).utf8(rt));
                }

                auto result = engine->rewritePdf(input, gsArgs);
                return bytesToJsValue(rt, std::move(result));
            }));

    rt.global().setProperty(rt, "giovanni_gs", std::move(gs));
}

} // namespace giovanni::jsi

#endif // GIOVANNI_JSI_ENABLED