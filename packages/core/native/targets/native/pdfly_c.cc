#include "pdfly_c.h"

#include "../../impl/qpdf/qpdf_engine.h"

#include <cstring>
#include <stdexcept>
#include <string>
#include <thread>
#include <vector>

// ---------------------------------------------------------------------------
// Thread-local error storage
// ---------------------------------------------------------------------------

static thread_local std::string tl_lastError;

static int setError(const char* msg) {
    tl_lastError = msg ? msg : "unknown error";
    return -1;
}

const char* pdfly_last_error(void) {
    return tl_lastError.c_str();
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

PdflyQpdfHandle pdfly_qpdf_create(void) {
    try {
        return reinterpret_cast<PdflyQpdfHandle>(new pdfly::QpdfEngine());
    } catch (const std::exception& e) {
        setError(e.what());
        return nullptr;
    }
}

void pdfly_qpdf_destroy(PdflyQpdfHandle handle) {
    delete reinterpret_cast<pdfly::QpdfEngine*>(handle);
}

// ---------------------------------------------------------------------------
// Version
// ---------------------------------------------------------------------------

int pdfly_get_version(PdflyQpdfHandle handle, char* out, size_t out_len) {
    if (!handle || !out || out_len == 0) return setError("invalid arguments");
    try {
        auto* eng = reinterpret_cast<pdfly::QpdfEngine*>(handle);
        std::string v = eng->getVersion();
        std::strncpy(out, v.c_str(), out_len - 1);
        out[out_len - 1] = '\0';
        return 0;
    } catch (const std::exception& e) {
        return setError(e.what());
    }
}

// ---------------------------------------------------------------------------
// Write options defaults
// ---------------------------------------------------------------------------

void pdfly_write_options_default(PdflyWriteOptions* opts) {
    if (!opts) return;
    opts->compressionLevel           = 6;
    opts->recompressFlate            = 1;
    opts->decodeLevel                = "generalized";
    opts->objectStreams               = "generate";
    opts->compressPages              = 0;
    opts->removeUnreferencedResources = 0;
    opts->linearize                  = 0;
}

static pdfly::WriteOptions toWriteOptions(const PdflyWriteOptions* c) {
    pdfly::WriteOptions opts;
    if (!c) return opts;
    opts.compressionLevel           = c->compressionLevel;
    opts.recompressFlate            = c->recompressFlate != 0;
    if (c->decodeLevel)   opts.decodeLevel   = c->decodeLevel;
    if (c->objectStreams)  opts.objectStreams  = c->objectStreams;
    opts.compressPages              = c->compressPages != 0;
    opts.removeUnreferencedResources = c->removeUnreferencedResources != 0;
    opts.linearize                  = c->linearize != 0;
    return opts;
}

// ---------------------------------------------------------------------------
// pdfly_write_pdf
// ---------------------------------------------------------------------------

int pdfly_write_pdf(
    PdflyQpdfHandle handle,
    const uint8_t* input, size_t input_size,
    const PdflyWriteOptions* options,
    const char* password,
    uint8_t** out_data, size_t* out_size)
{
    if (!handle || !input || !out_data || !out_size) return setError("invalid arguments");
    try {
        auto* eng = reinterpret_cast<pdfly::QpdfEngine*>(handle);
        std::vector<uint8_t> in(input, input + input_size);
        std::string pwd = password ? password : "";
        auto result = eng->writePdf(in, toWriteOptions(options), pwd);

        *out_size = result.size();
        *out_data = static_cast<uint8_t*>(std::malloc(result.size()));
        if (!*out_data) return setError("out of memory");
        std::memcpy(*out_data, result.data(), result.size());
        return 0;
    } catch (const std::exception& e) {
        return setError(e.what());
    }
}

// ---------------------------------------------------------------------------
// pdfly_split_pages
// ---------------------------------------------------------------------------

int pdfly_split_pages(
    PdflyQpdfHandle handle,
    const uint8_t* input, size_t input_size,
    uint8_t*** out_pages, size_t** out_sizes, size_t* out_count)
{
    if (!handle || !input || !out_pages || !out_sizes || !out_count)
        return setError("invalid arguments");
    try {
        auto* eng = reinterpret_cast<pdfly::QpdfEngine*>(handle);
        std::vector<uint8_t> in(input, input + input_size);
        auto pages = eng->splitPages(in);

        size_t n = pages.size();
        *out_count = n;
        *out_pages = static_cast<uint8_t**>(std::malloc(n * sizeof(uint8_t*)));
        *out_sizes = static_cast<size_t*>(std::malloc(n * sizeof(size_t)));
        if (!*out_pages || !*out_sizes) {
            std::free(*out_pages);
            std::free(*out_sizes);
            return setError("out of memory");
        }

        for (size_t i = 0; i < n; ++i) {
            (*out_sizes)[i] = pages[i].size();
            (*out_pages)[i] = static_cast<uint8_t*>(std::malloc(pages[i].size()));
            if (!(*out_pages)[i]) {
                for (size_t j = 0; j < i; ++j) std::free((*out_pages)[j]);
                std::free(*out_pages);
                std::free(*out_sizes);
                return setError("out of memory");
            }
            std::memcpy((*out_pages)[i], pages[i].data(), pages[i].size());
        }
        return 0;
    } catch (const std::exception& e) {
        return setError(e.what());
    }
}

// ---------------------------------------------------------------------------
// pdfly_merge_pdfs
// ---------------------------------------------------------------------------

int pdfly_merge_pdfs(
    PdflyQpdfHandle handle,
    const uint8_t* const* inputs, const size_t* input_sizes, size_t input_count,
    uint8_t** out_data, size_t* out_size)
{
    if (!handle || !inputs || !input_sizes || !out_data || !out_size)
        return setError("invalid arguments");
    try {
        auto* eng = reinterpret_cast<pdfly::QpdfEngine*>(handle);
        std::vector<std::vector<uint8_t>> vecs;
        vecs.reserve(input_count);
        for (size_t i = 0; i < input_count; ++i) {
            vecs.emplace_back(inputs[i], inputs[i] + input_sizes[i]);
        }
        auto result = eng->mergePdfs(vecs);

        *out_size = result.size();
        *out_data = static_cast<uint8_t*>(std::malloc(result.size()));
        if (!*out_data) return setError("out of memory");
        std::memcpy(*out_data, result.data(), result.size());
        return 0;
    } catch (const std::exception& e) {
        return setError(e.what());
    }
}

// ---------------------------------------------------------------------------
// pdfly_get_document_info
// ---------------------------------------------------------------------------

static char* dupstr(const std::string& s) {
    char* p = static_cast<char*>(std::malloc(s.size() + 1));
    if (p) std::memcpy(p, s.c_str(), s.size() + 1);
    return p;
}

int pdfly_get_document_info(
    PdflyQpdfHandle handle,
    const uint8_t* input, size_t input_size,
    const char* password,
    PdflyDocumentInfo* out)
{
    if (!handle || !input || !out) return setError("invalid arguments");
    try {
        auto* eng = reinterpret_cast<pdfly::QpdfEngine*>(handle);
        std::vector<uint8_t> in(input, input + input_size);
        std::string pwd = password ? password : "";
        auto info = eng->getDocumentInfo(in, pwd);

        out->numPages     = info.numPages;
        out->isEncrypted  = info.isEncrypted ? 1 : 0;
        out->isLinearized = info.isLinearized ? 1 : 0;
        std::strncpy(out->pdfVersion, info.pdfVersion.c_str(), sizeof(out->pdfVersion) - 1);
        out->pdfVersion[sizeof(out->pdfVersion) - 1] = '\0';

        out->title   = info.title   ? dupstr(*info.title)   : nullptr;
        out->author  = info.author  ? dupstr(*info.author)  : nullptr;
        out->subject = info.subject ? dupstr(*info.subject) : nullptr;
        out->creator = info.creator ? dupstr(*info.creator) : nullptr;

        return 0;
    } catch (const std::exception& e) {
        return setError(e.what());
    }
}

// ---------------------------------------------------------------------------
// Memory management
// ---------------------------------------------------------------------------

void pdfly_buffer_free(uint8_t* data) {
    std::free(data);
}

void pdfly_pages_free(uint8_t** pages, size_t* sizes, size_t count) {
    if (pages) {
        for (size_t i = 0; i < count; ++i) std::free(pages[i]);
        std::free(pages);
    }
    std::free(sizes);
}

void pdfly_document_info_free(PdflyDocumentInfo* info) {
    if (!info) return;
    std::free(info->title);
    std::free(info->author);
    std::free(info->subject);
    std::free(info->creator);
    info->title = info->author = info->subject = info->creator = nullptr;
}
