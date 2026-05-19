// declarations for the Ghostscript WASM module — implementations live under api/

#ifndef GHOSTSCRIPT_WASM_HH
#define GHOSTSCRIPT_WASM_HH

#include <emscripten/val.h>
#include <string>

// api/ghostscript_api.cc
std::string getGhostscriptVersion();
emscripten::val rewritePdf(const emscripten::val& inputArray, const emscripten::val& argsArray);

#endif // GHOSTSCRIPT_WASM_HH
