// shared helpers used across compress/split/extract paths

#include "../qpdf_wasm.hh"
#include <stdexcept>

qpdf_stream_decode_level_e getDecodeLevel(const std::string& level) {
    if (level == "none") return qpdf_dl_none;
    if (level == "generalized") return qpdf_dl_generalized;
    if (level == "specialized") return qpdf_dl_specialized;
    if (level == "all") return qpdf_dl_all;

    throw std::runtime_error("Invalid decode level: " + level);
}

qpdf_object_stream_e getObjectStreamMode(const std::string& mode) {
    if (mode == "disable") return qpdf_o_disable;
    if (mode == "preserve") return qpdf_o_preserve;
    if (mode == "generate") return qpdf_o_generate;

    throw std::runtime_error("Invalid object stream mode: " + mode);
}

std::string getQpdfVersion() {
    return QPDF::QPDFVersion();
}

// copy a qpdf Buffer into a fresh JS Uint8Array (caller-owned)
emscripten::val bufferToUint8Array(const std::shared_ptr<Buffer>& buffer) {
    if (!buffer) {
        throw std::runtime_error("bufferToUint8Array: buffer is null");
    }

    const unsigned char* data = buffer->getBuffer();
    size_t size = buffer->getSize();
    if (size > 0 && data == nullptr) {
        throw std::runtime_error("bufferToUint8Array: buffer data pointer is null");
    }
    auto view = emscripten::typed_memory_view(size, data);
    emscripten::val uint8Array = emscripten::val::global("Uint8Array").new_(size);
    uint8Array.call<void>("set", view);

    return uint8Array;
}
