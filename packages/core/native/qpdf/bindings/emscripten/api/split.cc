// Thin wrapper — marshals JS types and delegates to QpdfEngine::splitPages.

#include "../qpdf_wasm.hh"
#include "qpdf_engine.h"
#include <stdexcept>

emscripten::val splitPages(const emscripten::val& inputArray) {
    try {
        std::vector<uint8_t> input = emscripten::vecFromJSArray<uint8_t>(inputArray);
        auto pages = getEngine().splitPages(input);

        emscripten::val result = emscripten::val::array();
        for (const auto& page : pages) {
            result.call<void>("push", vecToUint8Array(page));
        }
        return result;
    } catch (const std::exception& e) {
        throw std::runtime_error(std::string("PDF split failed: ") + e.what());
    }
}
