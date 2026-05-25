// gs_engine.h — Ghostscript implementation of IGhostscriptEngine (placeholder)
//
// TODO: implement using the gsapi C API (gsapi_new_instance, gsapi_run_string, etc.)
// See: https://ghostscript.com/docs/9.54.0/API.htm

#pragma once

#include <pdfly/api.h>

namespace pdfly {

class GhostscriptEngine final : public IGhostscriptEngine {
public:
    std::string getVersion() override;

    std::vector<uint8_t> rewritePdf(
        const std::vector<uint8_t>& input,
        const std::vector<std::string>& args) override;
};

} // namespace pdfly
