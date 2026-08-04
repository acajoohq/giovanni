# Native C Endpoints

Native C FFI endpoints are declared in `giovanni_c.h` and target direct host-language interoperability.

## Lifecycle

```c
GiovanniQpdfHandle giovanni_qpdf_create(void);
void giovanni_qpdf_destroy(GiovanniQpdfHandle handle);
```

## Version

```c
int giovanni_get_version(
  GiovanniQpdfHandle handle,
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
```

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

## Return Contract

- Most operation endpoints return `0` on success and `-1` on error.
- On error, call `giovanni_last_error()` on the same thread.