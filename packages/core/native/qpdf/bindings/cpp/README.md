# giovanni C++ binding for qpdf

A pure C++ API that exposes the same operations as the TypeScript `QpdfBinding` interface — no WASM, no JavaScript runtime required.

## API

```cpp
#include <giovanni/giovanni_qpdf.h>

namespace giovanni {

// Returns the linked qpdf library version.
std::string getVersion();

// Write / compress a PDF.
std::vector<uint8_t> writePdf(
    const std::vector<uint8_t>& input,
    const WriteOptions& options = {},
    const std::string& password = "");

// Split a PDF into individual single-page PDFs.
std::vector<std::vector<uint8_t>> splitPages(
    const std::vector<uint8_t>& input);

// Merge multiple PDFs into one.
std::vector<uint8_t> mergePdfs(
    const std::vector<std::vector<uint8_t>>& inputs);

// Read document metadata.
DocumentInfo getDocumentInfo(
    const std::vector<uint8_t>& input,
    const std::string& password = "");

// Extract embedded images.
std::vector<ExtractedImage> extractImages(
    const std::vector<uint8_t>& input);

}
```

All functions throw `std::runtime_error` on failure.

## Building

### Prerequisites

- CMake ≥ 3.16
- A C++20 compiler (GCC 10+, Clang 12+, MSVC 2019+)
- qpdf source tree **or** an installed qpdf package

### From source (using the vendored qpdf)

The workspace ships the full qpdf source in `vendor/qpdf/`.

```bash
cd packages/core/native/qpdf/bindings/cpp

cmake -B build \
  -DQPDF_SOURCE_DIR=../../../../../../vendor/qpdf

cmake --build build --parallel
```

This produces `build/libgiovanni_qpdf.a` (or `.so` / `.dll` if `BUILD_SHARED_LIBS=ON`).

### With a system-installed qpdf

```bash
cmake -B build -DGIOVANNI_USE_SYSTEM_QPDF=ON
cmake --build build --parallel
```

### Build the example

```bash
cmake -B build \
  -DQPDF_SOURCE_DIR=../../../../../../vendor/qpdf \
  -DGIOVANNI_BUILD_EXAMPLE=ON
cmake --build build --parallel
./build/giovanni_example input.pdf output.pdf
```

## Usage

```cpp
#include <giovanni/giovanni_qpdf.h>
#include <fstream>
#include <iterator>

int main() {
    // Load PDF from disk
    std::ifstream f("input.pdf", std::ios::binary);
    std::vector<uint8_t> data(std::istreambuf_iterator<char>(f), {});

    // Inspect
    auto info = giovanni::getDocumentInfo(data);
    // info.numPages, info.pdfVersion, info.isEncrypted, info.isLinearized, ...

    // Compress and linearize
    giovanni::WriteOptions opts;
    opts.compressionLevel = 9;
    opts.linearize = true;
    auto result = giovanni::writePdf(data, opts);

    // Split into pages
    auto pages = giovanni::splitPages(data);

    // Merge pages back
    auto merged = giovanni::mergePdfs(pages);

    // Extract images
    auto images = giovanni::extractImages(data);
    for (auto& img : images) {
        // img.width, img.height, img.filter, img.strategy, img.bytes ...
    }
}
```

## Relationship to the TypeScript API

This library mirrors `QpdfBinding` from `@giovanni/core/bindings`:

| TypeScript (`QpdfBinding`)           | C++ (`giovanni::`)                     |
| ------------------------------------ | ----------------------------------- |
| `init(): Promise<void>`              | _(linking is sufficient)_           |
| `getVersion(): Promise<string>`      | `getVersion(): string`              |
| `writePdf(data, options, password?)` | `writePdf(data, options, password)` |
| `splitPages(data)`                   | `splitPages(data)`                  |
| `mergePdfs(inputs)`                  | `mergePdfs(inputs)`                 |
| `getDocumentInfo(data, password?)`   | `getDocumentInfo(data, password)`   |
| `extractImages(data)`                | `extractImages(data)`               |

`NativeWriteOptions` → `giovanni::WriteOptions`
`NativeDocumentInfo` → `giovanni::DocumentInfo`
`NativeExtractedImage` → `giovanni::ExtractedImage`

Input/output buffers are `std::vector<uint8_t>` instead of `Uint8Array`.
