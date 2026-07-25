#include "gs_engine.h"

// TODO: Implement GhostscriptEngine methods using the Ghostscript API.
namespace giovanni {

    std::string GhostscriptEngine::getVersion() {
        return "TEST";
    }

    std::vector<uint8_t> GhostscriptEngine::rewritePdf(
        const std::vector<uint8_t>& input,
        const std::vector<std::string>& args) {
        return {};
    }
}
