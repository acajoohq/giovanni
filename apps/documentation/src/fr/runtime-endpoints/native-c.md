# Native C Endpoints

Endpoints C exposes via `giovanni_c.h`.

## Lifecycle

- `giovanni_qpdf_create`
- `giovanni_qpdf_destroy`

## Operations

- `giovanni_write_pdf`
- `giovanni_split_pages`
- `giovanni_merge_pdfs`
- `giovanni_get_document_info`

## Memory

- `giovanni_buffer_free`
- `giovanni_pages_free`
- `giovanni_document_info_free`

## Error

- `giovanni_last_error`