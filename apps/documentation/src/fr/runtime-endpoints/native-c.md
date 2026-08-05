# Native C Endpoints

Les endpoints C FFI natifs sont déclarés dans `giovanni_c.h` et visent l'interopérabilité directe avec le langage hôte.

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

## Options d'Écriture

```c
void giovanni_write_options_default(GiovanniWriteOptions* opts);
```

Champs de `GiovanniWriteOptions` :

- `compressionLevel`
- `recompressFlate`
- `decodeLevel`
- `objectStreams`
- `compressPages`
- `removeUnreferencedResources`
- `linearize`

## Endpoints d'Opérations PDF

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

## Endpoints de Gestion Mémoire

```c
void giovanni_buffer_free(uint8_t* data);
void giovanni_pages_free(uint8_t** pages, size_t* sizes, size_t count);
void giovanni_document_info_free(GiovanniDocumentInfo* info);
```

## Endpoint d'Erreur

```c
const char* giovanni_last_error(void);
```

## Contrat de Retour

- La plupart des endpoints d'opérations retournent `0` en cas de succès et `-1` en cas d'erreur.
- En cas d'erreur, appelez `giovanni_last_error()` depuis le même thread.
