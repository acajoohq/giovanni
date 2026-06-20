// api.h — Abstract C++ interface for the giovanni API
//
// This is the single contract that all build targets implement:
//   - targets/wasm/   → Emscripten adapter over IQpdfEngine + IGhostscriptEngine
//   - targets/jsi/    → React Native JSI adapter
//   - targets/native/ → Standalone C library (C wrapper around IQpdfEngine)
//
// The concrete implementations live in impl/qpdf/ and impl/ghostscript/.
// No platform or runtime headers are included here.

#pragma once

#include "types.h"

#include <string>
#include <vector>

namespace giovanni {

// ---------------------------------------------------------------------------
// IQpdfEngine — mirrors the TypeScript QpdfBinding interface
// ---------------------------------------------------------------------------

class IQpdfEngine {
public:
    virtual ~IQpdfEngine() = default;

    // Return the linked qpdf library version string.
    virtual std::string getVersion() = 0;

    // Write / compress a PDF.
    // Throws std::runtime_error on failure.
    virtual std::vector<uint8_t> writePdf(
        const std::vector<uint8_t>& input,
        const WriteOptions& options = {},
        const std::string& password = "") = 0;

    // Split into individual single-page PDFs.
    virtual std::vector<std::vector<uint8_t>> splitPages(
        const std::vector<uint8_t>& input) = 0;

    // Merge multiple PDFs into one.
    // Throws if inputs is empty.
    virtual std::vector<uint8_t> mergePdfs(
        const std::vector<std::vector<uint8_t>>& inputs) = 0;

    // Read document metadata (no full write cycle).
    virtual DocumentInfo getDocumentInfo(
        const std::vector<uint8_t>& input,
        const std::string& password = "") = 0;

    // Extract embedded images.
    virtual std::vector<ExtractedImage> extractImages(
        const std::vector<uint8_t>& input) = 0;
};

// ---------------------------------------------------------------------------
// IGhostscriptEngine — mirrors the TypeScript GhostscriptBinding interface
// ---------------------------------------------------------------------------

class IGhostscriptEngine {
public:
    virtual ~IGhostscriptEngine() = default;

    // Return the Ghostscript library version string.
    virtual std::string getVersion() = 0;

    // Run a Ghostscript rewrite pass with the given arguments.
    virtual std::vector<uint8_t> rewritePdf(
        const std::vector<uint8_t>& input,
        const std::vector<std::string>& args) = 0;
};

} // namespace giovanni
