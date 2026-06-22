// giovanni_qpdf.cc - free-function API backed by QpdfEngine
//
// This file implements the free functions declared in giovanni_qpdf.h by
// delegating to a QpdfEngine instance from native/impl/qpdf/.
//
// The actual PDF logic lives in impl/qpdf/qpdf_engine.cc.

#include "giovanni/giovanni_qpdf.h"
#include "../../../../impl/qpdf/qpdf_engine.h"

namespace giovanni {

static QpdfEngine& defaultEngine() {
    static QpdfEngine engine;
    return engine;
}

std::string getVersion() {
    return defaultEngine().getVersion();
}

std::vector<uint8_t> writePdf(
    const std::vector<uint8_t>& input,
    const WriteOptions& options,
    const std::string& password)
{
    return defaultEngine().writePdf(input, options, password);
}

std::vector<std::vector<uint8_t>> splitPages(const std::vector<uint8_t>& input) {
    return defaultEngine().splitPages(input);
}

std::vector<uint8_t> mergePdfs(const std::vector<std::vector<uint8_t>>& inputs) {
    return defaultEngine().mergePdfs(inputs);
}

DocumentInfo getDocumentInfo(const std::vector<uint8_t>& input, const std::string& password) {
    return defaultEngine().getDocumentInfo(input, password);
}

std::vector<ExtractedImage> extractImages(const std::vector<uint8_t>& input) {
    return defaultEngine().extractImages(input);
}

} // namespace giovanni
