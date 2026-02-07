# @qpdf/wasm

## Todo's

- [ ] Move the `../qpdf` source to the `qpdf` directory
- [ ] Choose the outputs of the lib
- [ ] <https://tsdown.dev/options/lint>
- [ ] Find a strategy for updates of the qpdf library
- [ ] CI / CD
- [ ] Review the code
  - [ ] WASM build
  - [ ] Library design
  - [ ] Tests
- [ ] Choose a package name
- [ ] Make from scratch a demo with a simple vite app
- [ ] Clean the bloat
- [ ] Publish

Modern WebAssembly build of [qpdf](https://github.com/qpdf/qpdf) for PDF compression and manipulation in the browser and Node.js.

## Features

- 🚀 **Fast** - Compiled with Emscripten optimizations
- 📦 **Modern** - ESM and CommonJS support, TypeScript definitions included
- 🎯 **Simple API** - Compress PDFs with a single function call
- ⚙️ **Advanced API** - Fine-grained control for power users
- 🌐 **Universal** - Works in browsers and Node.js
- 🔒 **Private** - All processing happens locally, no server required

## Installation

```bash
npm install @qpdf/wasm
```

## Quick Start

### Simple API (Recommended)

```typescript
import { compressPdf } from '@qpdf/wasm';

// Fetch a PDF
const pdfBytes = await fetch('document.pdf').then(r => r.arrayBuffer());

// Compress it
const result = await compressPdf(pdfBytes, {
  compressionLevel: 9,
  decodeLevel: 'all',
  recompressFlate: true
});

console.log(`Original: ${result.originalSize} bytes`);
console.log(`Compressed: ${result.compressedSize} bytes`);
console.log(`Saved: ${result.savedBytes} bytes (${(result.savedBytes / result.originalSize * 100).toFixed(1)}%)`);

// Download the compressed PDF
const blob = new Blob([result.data], { type: 'application/pdf' });
const url = URL.createObjectURL(blob);
```

### Advanced API (Fine-Grained Control)

```typescript
import { QPDF, QPDFWriter } from '@qpdf/wasm';

// Load PDF
const qpdf = new QPDF();
await qpdf.processMemoryFile(pdfBytes);

// Get metadata
console.log(`Pages: ${qpdf.getNumPages()}`);
console.log(`Version: ${qpdf.getPDFVersion()}`);
console.log(`Encrypted: ${qpdf.isEncrypted()}`);

const info = qpdf.getInfo();
console.log('PDF Info:', info);

// Configure compression
const writer = new QPDFWriter(qpdf);
await writer.setCompressionLevel(9);
await writer.setDecodeLevel('all');
await writer.setRecompressFlate(true);
await writer.setObjectStreamMode('generate');

// Write compressed PDF
await writer.write();
const compressedData = writer.getBuffer();

// Clean up
writer.cleanup();
qpdf.cleanup();
```

## API Reference

### Simple API

#### `compressPdf(input, options?)`

Compress a PDF with the specified options.

**Parameters:**

- `input: Uint8Array | ArrayBuffer` - PDF file data
- `options?: CompressionOptions` - Compression options (see below)

**Returns:** `Promise<CompressionResult>`

**Example:**

```typescript
const result = await compressPdf(pdfBytes, {
  compressionLevel: 9,
  decodeLevel: 'all'
});
```

#### `initQpdf()`

Preload the WASM module (optional, automatically called by `compressPdf`).

#### `getVersion()`

Get the qpdf library version string.

### Advanced API

#### `class QPDF`

Represents a loaded PDF file.

**Methods:**

- `processMemoryFile(input: Uint8Array | ArrayBuffer, password?: string): Promise<void>` - Load a PDF
- `getNumPages(): number` - Get number of pages
- `getPDFVersion(): string` - Get PDF version (e.g., "1.7")
- `isEncrypted(): boolean` - Check if encrypted
- `isLinearized(): boolean` - Check if linearized (web-optimized)
- `getInfo(): QPDFInfo` - Get comprehensive metadata
- `cleanup(): void` - Free WASM resources

#### `class QPDFWriter`

Write a PDF with compression settings.

**Constructor:**

- `new QPDFWriter(qpdf: QPDF)`

**Methods:**

- `setCompressionLevel(level: number): Promise<void>` - Set compression level (1-9)
- `setDecodeLevel(level: DecodeLevel): Promise<void>` - Set decode level
- `setRecompressFlate(value: boolean): Promise<void>` - Enable/disable flate recompression
- `setObjectStreamMode(mode: ObjectStreamMode): Promise<void>` - Set object stream mode
- `setCompressPages(value: boolean): Promise<void>` - Enable/disable page compression
- `setRemoveUnreferencedResources(value: boolean): Promise<void>` - Remove unused resources
- `write(): Promise<void>` - Write the PDF
- `getBuffer(): Uint8Array` - Get the compressed PDF data
- `cleanup(): void` - Free WASM resources

### Compression Options

```typescript
interface CompressionOptions {
  // Compression level (1-9)
  // 1 = fastest, least compression
  // 9 = slowest, best compression
  compressionLevel?: number; // default: 6

  // Decode level - controls stream recompression
  // 'none': Don't decode anything
  // 'generalized': Decode common filters
  // 'specialized': Decode JPEG, etc.
  // 'all': Maximum compression
  decodeLevel?: 'none' | 'generalized' | 'specialized' | 'all'; // default: 'generalized'

  // Recompress flate-compressed streams
  recompressFlate?: boolean; // default: true

  // Object stream mode
  // 'preserve': Keep existing object streams
  // 'disable': Disable object streams
  // 'generate': Generate object streams (better compression)
  objectStreams?: 'preserve' | 'disable' | 'generate'; // default: 'preserve'

  // Combine multiple content streams per page
  compressPages?: boolean; // default: false

  // Remove unreferenced resources
  removeUnreferencedResources?: boolean; // default: false
}
```

## Utility Functions

```typescript
import { formatBytes, calculateSavings, downloadBuffer } from '@qpdf/wasm';

// Format bytes as human-readable string
formatBytes(1536); // "1.5 KB"

// Calculate compression savings
const savings = calculateSavings(1000, 500);
// { savedBytes: 500, compressionRatio: 0.5, percentageSaved: 50 }

// Trigger browser download
downloadBuffer(compressedData, 'compressed.pdf');
```

## Building from Source

### Prerequisites

1. **Emscripten SDK** - Install and activate:

   ```bash
   git clone https://github.com/emscripten-core/emsdk.git
   cd emsdk
   ./emsdk install latest
   ./emsdk activate latest
   source ./emsdk_env.sh
   ```

2. **Node.js 18+** - For the build system

3. **Parent qpdf source** - This project expects the qpdf source to be in a sibling directory:

   ```
   /path/to/
   ├── qpdf/          ← parent qpdf source
   └── qpdf-wasm/     ← this project
   ```

### Build Steps

```bash
# 1. Activate Emscripten environment
source /path/to/emsdk/emsdk_env.sh

# 2. Install npm dependencies
npm install

# 3. Build WASM from qpdf source (outputs to build/wasm/)
npm run build:wasm

# 4. Build TypeScript library (outputs to dist/)
npm run build:lib

# Or build everything at once:
npm run build
```

### Build Output

After building, the `dist/` directory will contain:

- `index.mjs` - ESM bundle
- `index.cjs` - CommonJS bundle
- `index.d.mts` - TypeScript definitions for ESM consumers
- `index.d.cts` - TypeScript definitions for CommonJS consumers
- `qpdf.wasm` - WebAssembly binary (~800KB)
- `qpdf.js` - Emscripten glue code

### Troubleshooting

**Error: "Emscripten not found"**

- Make sure you've activated the Emscripten environment: `source /path/to/emsdk/emsdk_env.sh`

**Error: "Parent qpdf source not found"**

- Ensure the qpdf source is in `../qpdf/` relative to this project
- The build script expects this directory structure

**Build fails with missing dependencies**

- The build uses Emscripten ports for zlib and libjpeg, which are downloaded automatically
- Ensure you have an internet connection for the first build

## Browser Compatibility

- Chrome/Chromium 57+
- Firefox 52+
- Safari 11+
- Edge 16+
- Node.js 18+

All modern browsers with WebAssembly support.

## Demo

Run the demo locally:

```bash
npm run demo
```

This will start a development server with a modern, mobile-friendly PDF compression demo.

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## License

Apache 2.0 - See [LICENSE](LICENSE) file for details.

qpdf is developed by [Jay Berkenbilt](https://github.com/qpdf/qpdf) and contributors.

## Contributing

Contributions are welcome! Please open an issue or pull request.

## Acknowledgments

This project is built on top of the excellent [qpdf](https://github.com/qpdf/qpdf) library by Jay Berkenbilt.
