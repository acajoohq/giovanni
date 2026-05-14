// Emscripten bindings — expose a narrow Ghostscript rewrite API to JavaScript

#include "ghostscript_wasm.hh"
#include <emscripten/bind.h>

using namespace emscripten;

EMSCRIPTEN_BINDINGS(ghostscript_module) {
    function("rewritePdf", &rewritePdf);
    function("getGhostscriptVersion", &getGhostscriptVersion);
}
