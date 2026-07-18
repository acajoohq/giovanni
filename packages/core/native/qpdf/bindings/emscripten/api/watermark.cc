// Thin wrapper - marshals JS types and delegates to QpdfEngine::watermarkPdf.

#include "../qpdf_wasm.hh"
#include "qpdf_engine.h"
#include <stdexcept>

emscripten::val watermarkPdf(
    const emscripten::val& inputArray,
    const emscripten::val& watermarkArray,
    const WatermarkOptions& options,
    const std::string& password,
    const std::string& watermarkPassword)
{
    try {
        std::vector<uint8_t> input = emscripten::vecFromJSArray<uint8_t>(inputArray);
        std::vector<uint8_t> watermark = emscripten::vecFromJSArray<uint8_t>(watermarkArray);

        auto result = getEngine().watermarkPdf(
            input,
            watermark,
            options.underlay,
            options.pages,
            password,
            watermarkPassword);

        return vecToUint8Array(result);
    } catch (const std::exception& e) {
        throw std::runtime_error(std::string("PDF watermark failed: ") + e.what());
    }
}
