// shared helpers used across compress/split/extract paths

#include "../qpdf_wasm.hh"

qpdf_stream_decode_level_e getDecodeLevel(const std::string& level) {
    if (level == "none") return qpdf_dl_none;
    if (level == "generalized") return qpdf_dl_generalized;
    if (level == "specialized") return qpdf_dl_specialized;
    if (level == "all") return qpdf_dl_all;

    return qpdf_dl_generalized;
}

qpdf_object_stream_e getObjectStreamMode(const std::string& mode) {
    if (mode == "disable") return qpdf_o_disable;
    if (mode == "preserve") return qpdf_o_preserve;
    if (mode == "generate") return qpdf_o_generate;

    return qpdf_o_preserve;
}

std::string getQpdfVersion() {
    return QPDF::QPDFVersion();
}

// copy a qpdf Buffer into a fresh JS Uint8Array (caller-owned)
emscripten::val bufferToUint8Array(std::shared_ptr<Buffer>& buffer) {
    const unsigned char* data = buffer->getBuffer();
    size_t size = buffer->getSize();
    auto view = emscripten::typed_memory_view(size, data);
    emscripten::val uint8Array = emscripten::val::global("Uint8Array").new_(size);
    uint8Array.call<void>("set", view);

    return uint8Array;
}
