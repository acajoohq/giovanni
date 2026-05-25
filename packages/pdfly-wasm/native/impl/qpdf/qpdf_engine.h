// qpdf_engine.h — Concrete libqpdf implementation of IQpdfEngine
//
// No platform dependencies (no Emscripten, no JSI).
// Include <pdfly/api.h> via the interface/ include path.

#pragma once

#include <pdfly/api.h>

namespace pdfly {

class QpdfEngine final : public IQpdfEngine {
public:
    std::string getVersion() override;

    std::vector<uint8_t> writePdf(
        const std::vector<uint8_t>& input,
        const WriteOptions& options,
        const std::string& password) override;

    std::vector<std::vector<uint8_t>> splitPages(
        const std::vector<uint8_t>& input) override;

    std::vector<uint8_t> mergePdfs(
        const std::vector<std::vector<uint8_t>>& inputs) override;

    DocumentInfo getDocumentInfo(
        const std::vector<uint8_t>& input,
        const std::string& password) override;

    std::vector<ExtractedImage> extractImages(
        const std::vector<uint8_t>& input) override;
};

} // namespace pdfly
