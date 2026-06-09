// Thin wrapper — marshals JS types and delegates to QpdfEngine::mergePdfs.

#include "../qpdf_wasm.hh"
#include "qpdf_engine.h"
#include <stdexcept>

emscripten::val mergePdfs(const emscripten::val& inputArrays) {
    try {
        int length = inputArrays["length"].as<int>();
        if (length == 0) {
            throw std::runtime_error("No PDFs provided to merge");
        }

        std::vector<std::vector<uint8_t>> inputs;
        inputs.reserve(static_cast<size_t>(length));
        for (int i = 0; i < length; ++i) {
            inputs.emplace_back(emscripten::vecFromJSArray<uint8_t>(inputArrays[i]));
        }

        auto result = getEngine().mergePdfs(inputs);
        return vecToUint8Array(result);
    } catch (const std::exception& e) {
        throw std::runtime_error(std::string("PDF merge failed: ") + e.what());
    }
}
