# Native C Endpoints

Native C FFI endpoints are declared in `giovanni_c.h` and target direct host-language interoperability.

## Lifecycle

```c
GiovanniQpdfHandle giovanni_qpdf_create(void);
void giovanni_qpdf_destroy(GiovanniQpdfHandle handle);

GiovanniGhostscriptHandle giovanni_ghostscript_create(void);
void giovanni_ghostscript_destroy(GiovanniGhostscriptHandle handle);
```

`giovanni_ghostscript_create` always succeeds if the build ran at all. Whether it's backed by a real Ghostscript or a stub is decided at native-library build time, not at runtime see [Ghostscript support](#ghostscript-support) below.

## Version

```c
int giovanni_get_version(
  GiovanniQpdfHandle handle,
  char* out,
  size_t out_len
);

int giovanni_get_ghostscript_version(
  GiovanniGhostscriptHandle handle,
  char* out,
  size_t out_len
);
```

## Write Options

```c
void giovanni_write_options_default(GiovanniWriteOptions* opts);
```

`GiovanniWriteOptions` fields:

- `compressionLevel`
- `recompressFlate`
- `decodeLevel`
- `objectStreams`
- `compressPages`
- `removeUnreferencedResources`
- `linearize`

## PDF Operation Endpoints

```c
int giovanni_write_pdf(
  GiovanniQpdfHandle handle,
  const uint8_t* input,
  size_t input_size,
  const GiovanniWriteOptions* options,
  const char* password,
  uint8_t** out_data,
  size_t* out_size
);

int giovanni_split_pages(
  GiovanniQpdfHandle handle,
  const uint8_t* input,
  size_t input_size,
  uint8_t*** out_pages,
  size_t** out_sizes,
  size_t* out_count
);

int giovanni_merge_pdfs(
  GiovanniQpdfHandle handle,
  const uint8_t* const* inputs,
  const size_t* input_sizes,
  size_t input_count,
  uint8_t** out_data,
  size_t* out_size
);

int giovanni_get_document_info(
  GiovanniQpdfHandle handle,
  const uint8_t* input,
  size_t input_size,
  const char* password,
  GiovanniDocumentInfo* out
);

int giovanni_rewrite_pdf(
  GiovanniGhostscriptHandle handle,
  const uint8_t* input,
  size_t input_size,
  const char* const* args,
  size_t args_count,
  uint8_t** out_data,
  size_t* out_size
);
```

`giovanni_rewrite_pdf` runs a Ghostscript `pdfwrite` pass. `args` are plain Ghostscript command-line arguments, the caller supplies device/quality flags (e.g. `-sDEVICE=pdfwrite`, `-dPDFSETTINGS=/screen`); input/output file arguments are added internally. See [Ghostscript support](#ghostscript-support) for what happens when the native library was built without Ghostscript.

## Memory Management Endpoints

```c
void giovanni_buffer_free(uint8_t* data);
void giovanni_pages_free(uint8_t** pages, size_t* sizes, size_t count);
void giovanni_document_info_free(GiovanniDocumentInfo* info);
```

## Error Endpoint

```c
const char* giovanni_last_error(void);
```

## Ghostscript support

Ghostscript support is decided when `libgiovanni_native` itself is built, not per-call:

- Built **with** Ghostscript linked in: `giovanni_rewrite_pdf` / `giovanni_get_ghostscript_version` run a real `pdfwrite` pass through the `gsapi_*` embedding API.
- Built **without** it (e.g. `GIOVANNI_SKIP_GHOSTSCRIPT` on the Windows build, or no GhostPDL source available): `GhostscriptEngine` is a stub the handle still creates/destroys fine, but `giovanni_rewrite_pdf` / `giovanni_get_ghostscript_version` return an error. Check `giovanni_last_error()`.

There's no runtime flag to query which case you're in if you need to know, call `giovanni_get_ghostscript_version` and check the return code.

On Windows specifically, Ghostscript links as a DLL import lib (`gsdll64.lib`), not a static archive `gsdll64.dll` must be present alongside the executable at runtime, or the process fails to start entirely (not just at first Ghostscript call), since it's an ordinary load-time DLL dependency.

## Return Contract

- Most operation endpoints return `0` on success and `-1` on error.
- On error, call `giovanni_last_error()` on the same thread.
