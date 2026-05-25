// pdfly_qpdf.h — C++ convenience API for pdfly (qpdf backend)
//
// This header re-exports the canonical types and interface from
// native/interface/ and exposes free functions backed by QpdfEngine.
//
// For direct interface usage, prefer including <pdfly/api.h> and constructing
// a pdfly::QpdfEngine directly (see native/impl/qpdf/qpdf_engine.h).

#pragma once

// Pull in the canonical shared types + abstract interface
#include <pdfly/types.h>
#include <pdfly/api.h>

namespace pdfly {

// ---------------------------------------------------------------------------
// Free-function convenience API
//
// These delegate to a default QpdfEngine instance.
// Prefer constructing pdfly::QpdfEngine directly for multi-instance or
// engine-swapping scenarios.
// ---------------------------------------------------------------------------

std::string getVersion();

std::vector<uint8_t> writePdf(
    const std::vector<uint8_t>& input,
    const WriteOptions& options = {},
    const std::string& password = "");

std::vector<std::vector<uint8_t>> splitPages(
    const std::vector<uint8_t>& input);

std::vector<uint8_t> mergePdfs(
    const std::vector<std::vector<uint8_t>>& inputs);

DocumentInfo getDocumentInfo(
    const std::vector<uint8_t>& input,
    const std::string& password = "");

std::vector<ExtractedImage> extractImages(
    const std::vector<uint8_t>& input);

} // namespace pdfly
