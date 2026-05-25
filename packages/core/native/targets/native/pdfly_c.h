// pdfly_c.h — C-compatible API for pdfly (qpdf backend)
//
// Designed for FFI use from any language that can call C functions:
// Python (ctypes/cffi), Rust, Go, Swift, etc.
//
// All functions return 0 on success and -1 on error.
// Retrieve the last error message with pdfly_last_error().
//
// Build via targets/native/CMakeLists.txt.

#pragma once

#ifdef __cplusplus
extern "C" {
#endif

#include <stddef.h>
#include <stdint.h>

// ---------------------------------------------------------------------------
// Opaque handle
// ---------------------------------------------------------------------------

typedef struct PdflyQpdf_s* PdflyQpdfHandle;

// ---------------------------------------------------------------------------
// Write options (mirrors pdfly::WriteOptions)
// ---------------------------------------------------------------------------

typedef struct {
    int compressionLevel;           // 1–9, default 6
    int recompressFlate;            // bool (0/1), default 1
    const char* decodeLevel;        // "none"|"generalized"|"specialized"|"all"
    const char* objectStreams;      // "preserve"|"disable"|"generate"
    int compressPages;              // bool (0/1), default 0
    int removeUnreferencedResources; // bool (0/1), default 0
    int linearize;                  // bool (0/1), default 0
} PdflyWriteOptions;

// ---------------------------------------------------------------------------
// Document info result (mirrors pdfly::DocumentInfo)
// ---------------------------------------------------------------------------

typedef struct {
    int numPages;
    char pdfVersion[32];
    int isEncrypted;
    int isLinearized;
    // Heap-allocated strings; may be NULL. Free with pdfly_document_info_free().
    char* title;
    char* author;
    char* subject;
    char* creator;
} PdflyDocumentInfo;

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

// Create a new QpdfEngine instance. Returns NULL on failure.
PdflyQpdfHandle pdfly_qpdf_create(void);

// Destroy a QpdfEngine instance.
void pdfly_qpdf_destroy(PdflyQpdfHandle handle);

// ---------------------------------------------------------------------------
// Version
// ---------------------------------------------------------------------------

// Write the qpdf library version string into out (null-terminated).
int pdfly_get_version(PdflyQpdfHandle handle, char* out, size_t out_len);

// ---------------------------------------------------------------------------
// Write options
// ---------------------------------------------------------------------------

// Populate opts with the default values matching pdfly::WriteOptions{}.
void pdfly_write_options_default(PdflyWriteOptions* opts);

// ---------------------------------------------------------------------------
// Operations
// ---------------------------------------------------------------------------

// Compress / rewrite a PDF.
// On success: *out_data is heap-allocated; free with pdfly_buffer_free().
int pdfly_write_pdf(
    PdflyQpdfHandle handle,
    const uint8_t* input, size_t input_size,
    const PdflyWriteOptions* options,   // NULL = use defaults
    const char* password,               // NULL = no password
    uint8_t** out_data, size_t* out_size);

// Split a PDF into per-page PDFs.
// On success: *out_pages[i] / *out_sizes[i] hold each page (heap-allocated).
// Free with pdfly_pages_free(*out_pages, *out_sizes, *out_count).
int pdfly_split_pages(
    PdflyQpdfHandle handle,
    const uint8_t* input, size_t input_size,
    uint8_t*** out_pages, size_t** out_sizes, size_t* out_count);

// Merge multiple PDFs into one.
// On success: *out_data is heap-allocated; free with pdfly_buffer_free().
int pdfly_merge_pdfs(
    PdflyQpdfHandle handle,
    const uint8_t* const* inputs, const size_t* input_sizes, size_t input_count,
    uint8_t** out_data, size_t* out_size);

// Get document metadata.
// On success: out is filled; call pdfly_document_info_free(out) when done.
int pdfly_get_document_info(
    PdflyQpdfHandle handle,
    const uint8_t* input, size_t input_size,
    const char* password,               // NULL = no password
    PdflyDocumentInfo* out);

// ---------------------------------------------------------------------------
// Memory management
// ---------------------------------------------------------------------------

// Free a buffer returned by write / merge operations.
void pdfly_buffer_free(uint8_t* data);

// Free page arrays returned by pdfly_split_pages.
void pdfly_pages_free(uint8_t** pages, size_t* sizes, size_t count);

// Free heap strings inside PdflyDocumentInfo (does NOT free the struct itself).
void pdfly_document_info_free(PdflyDocumentInfo* info);

// ---------------------------------------------------------------------------
// Error reporting
// ---------------------------------------------------------------------------

// Return the last error message for the current thread (never NULL).
// The pointer is valid until the next pdfly call on this thread.
const char* pdfly_last_error(void);

#ifdef __cplusplus
}
#endif
