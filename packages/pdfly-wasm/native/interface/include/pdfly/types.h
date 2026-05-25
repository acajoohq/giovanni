// types.h — Canonical shared types for the pdfly C++ API
//
// This is the single source of truth for all data types used across build
// targets (WASM, JSI, native binary). Every target includes this header.
// Mirrors the TypeScript NativeWriteOptions / NativeDocumentInfo / NativeExtractedImage types.

#pragma once

#include <cstdint>
#include <optional>
#include <string>
#include <vector>

namespace pdfly {

// ---------------------------------------------------------------------------
// WriteOptions — mirrors NativeWriteOptions
// ---------------------------------------------------------------------------

struct WriteOptions {
    // Flate compression level (1–9). 0 = use qpdf default.
    int compressionLevel = 6;
    bool recompressFlate = true;
    // "none" | "generalized" | "specialized" | "all"
    std::string decodeLevel = "generalized";
    // "preserve" | "disable" | "generate"
    std::string objectStreams = "generate";
    // Coalesce content streams before writing
    bool compressPages = false;
    bool removeUnreferencedResources = false;
    bool linearize = false;
};

// ---------------------------------------------------------------------------
// DocumentInfo — mirrors NativeDocumentInfo
// ---------------------------------------------------------------------------

struct DocumentInfo {
    int numPages = 0;
    std::string pdfVersion;
    bool isEncrypted = false;
    bool isLinearized = false;
    std::optional<std::string> title;
    std::optional<std::string> author;
    std::optional<std::string> subject;
    std::optional<std::string> creator;
};

// ---------------------------------------------------------------------------
// ExtractedImage — mirrors NativeExtractedImage
// ---------------------------------------------------------------------------

struct ExtractedImage {
    // Stable identity inside the source PDF ("objNum/genNum")
    std::string objectKey;
    // XObject resource key (e.g. "Im0")
    std::string xobjectKey;
    // Zero-based page index of first occurrence
    int pageIndex = 0;

    // Leaf encoding filter after stripping ASCII wrappers (e.g. "DCTDecode")
    std::string filter;
    int width = 0;
    int height = 0;
    int bitsPerComponent = 0;
    // Color space name or description string
    std::string colorSpace;
    // Resolved component count (0 = unsupported / unknown)
    int components = 0;
    // "unknown" | "gray" | "rgb" | "cmyk"
    std::string pixelColorModel;

    bool hasMask = false;
    bool hasSMask = false;
    bool isImageMask = false;

    // How bytes were extracted:
    // "encoded"     — compressed stream bytes (JPEG/JPX passthrough)
    // "raw-pixels"  — decoded uncompressed pixel data
    // "unsupported" — filter/color space not decoded
    // "error"       — extraction failed for this image
    std::string strategy;

    std::vector<uint8_t> bytes;
};

} // namespace pdfly
