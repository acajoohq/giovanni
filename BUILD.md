# Build Documentation

## Project Structure

```
qpdf-wasm/
├── src/                          # TypeScript source code
│   ├── core/                     # Core functionality
│   │   ├── compress.ts           # Simple compression API
│   │   ├── errors.ts             # Custom error classes
│   │   ├── module-loader.ts      # WASM module initialization
│   │   ├── qpdf.ts               # Advanced QPDF class
│   │   └── writer.ts             # Advanced QPDFWriter class
│   ├── types/                    # TypeScript type definitions
│   │   ├── index.ts              # Type exports
│   │   ├── options.ts            # CompressionOptions interface
│   │   ├── results.ts            # Result types
│   │   └── wasm-module.ts        # WASM module interface
│   ├── utils/                    # Utility functions
│   │   ├── buffer.ts             # Buffer utilities
│   │   ├── format.ts             # Formatting helpers
│   │   └── validation.ts         # Input validation
│   └── index.ts                  # Main entry point
│
├── wasm/                         # C++ WASM source & build config
│   ├── embind/                   # C++ bindings (from working version)
│   │   ├── qpdf_wasm_api.hh      # API declarations
│   │   ├── qpdf_wasm_api.cc      # API implementation
│   │   └── qpdf_bindings.cc      # Embind bindings
│   ├── build.sh                  # Build script
│   ├── CMakeLists.txt            # CMake configuration
│   └── emscripten-toolchain.cmake # Emscripten toolchain
│
├── test/                         # Test suite
│   ├── setup.ts                  # Test setup
│   ├── errors.test.ts            # Error tests
│   ├── validation.test.ts        # Validation tests
│   ├── format.test.ts            # Format utilities tests
│   └── fixtures/                 # Test fixtures (sample PDFs)
│
├── demo/                         # Demo page
│   └── index.html                # Modern, mobile-friendly demo
│
├── build/                        # Build output (gitignored)
│   └── wasm/                     # WASM build artifacts
│       ├── qpdf.js               # Emscripten glue code
│       └── qpdf.wasm             # Compiled WebAssembly binary
│
├── dist/                         # Distribution (gitignored)
│   ├── index.js                  # ESM bundle
│   ├── index.cjs                 # CommonJS bundle
│   ├── index.d.ts                # Type definitions
│   ├── qpdf.js                   # WASM glue (copied from build/)
│   └── qpdf.wasm                 # WASM binary (copied from build/)
│
├── package.json                  # npm package configuration
├── tsconfig.json                 # TypeScript configuration
├── tsdown.config.ts              # tsdown bundler configuration
├── vitest.config.ts              # Vitest test configuration
├── README.md                     # User documentation
├── LICENSE                       # Apache 2.0 license
└── .gitignore                    # Git ignore rules
```

## Build Pipeline

### Phase 1: WASM Compilation

```bash
npm run build:wasm
```

**What it does:**
1. Checks for Emscripten environment (`emcc`)
2. Verifies parent qpdf source exists at `../qpdf/`
3. Creates `wasm/cmake-build/` directory
4. Runs `emcmake cmake` with Emscripten toolchain
5. Compiles qpdf C++ source to WASM using Embind bindings
6. Outputs `qpdf.wasm` and `qpdf.js` to `build/wasm/`

**Dependencies:**
- Emscripten SDK (active environment)
- Parent qpdf source at `../qpdf/`
- CMake 3.16+

### Phase 2: TypeScript Compilation

```bash
npm run build:lib
```

**What it does:**
1. Runs `tsdown` to bundle TypeScript source
2. Generates ESM (`dist/index.js`) and CJS (`dist/index.cjs`) bundles
3. Generates TypeScript definitions (`dist/index.d.ts`)
4. Copies WASM artifacts from `build/wasm/` to `dist/`

**Dependencies:**
- WASM artifacts from Phase 1 (in `build/wasm/`)
- Node.js 18+

### Full Build

```bash
npm run build
```

Runs both phases sequentially: `build:wasm` then `build:lib`

## Testing

### Unit Tests

```bash
npm test                  # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

**Test framework:** Vitest with vite-plugin-wasm for WASM support

**Current tests:**
- ✅ Error class construction and instanceof checks
- ✅ Input validation (buffer normalization, option validation)
- ✅ Format utilities (formatBytes, calculateSavings, formatPercentage)
- ⏳ Integration tests (pending WASM build)

### Integration Testing

After building WASM, additional tests can be added for:
- `compressPdf()` with real PDFs
- QPDF class methods
- QPDFWriter class methods

## Code Quality

### Linting

```bash
npm run lint              # Check for issues
npm run format            # Auto-fix issues
```

**Tool:** oxlint (Rust-based, 50-100x faster than ESLint)

### Type Checking

```bash
npm run typecheck
```

**Tool:** TypeScript compiler with strict mode

### Package Validation

```bash
npm run validate
```

**Tool:** publint - validates package.json exports and structure

## Development Workflow

### Initial Setup

```bash
# 1. Activate Emscripten
source /path/to/emsdk/emsdk_env.sh

# 2. Install dependencies
npm install

# 3. Build everything
npm run build
```

### Making Changes

**TypeScript changes:**
```bash
# Edit files in src/
npm run build:lib        # Rebuild TypeScript
npm test                 # Run tests
```

**C++ binding changes:**
```bash
# Edit files in wasm/embind/
npm run build:wasm       # Rebuild WASM
npm run build:lib        # Rebuild TypeScript (to copy new WASM)
```

**Demo changes:**
```bash
# Edit demo/index.html
npm run demo             # Start dev server
```

## Troubleshooting

### WASM Build Issues

**"Emscripten not found"**
```bash
source /path/to/emsdk/emsdk_env.sh
which emcc  # Should show path
```

**"Parent qpdf source not found"**
```bash
# Ensure directory structure:
ls ../qpdf/include  # Should exist
```

**CMake configuration errors**
```bash
# Clean build directory
rm -rf wasm/cmake-build
npm run build:wasm
```

### TypeScript Build Issues

**"WASM artifacts not found"**
```bash
# Build WASM first
npm run build:wasm
# Then build TypeScript
npm run build:lib
```

**Import errors in demo**
```bash
# Make sure dist/ is built
npm run build
# Then start demo server
npm run demo
```

## Next Steps

### Phase 3: Integration Testing

Create sample PDF fixtures and add tests:
- `test/compress.test.ts` - Test compression with real PDFs
- `test/qpdf.test.ts` - Test QPDF class methods
- `test/writer.test.ts` - Test QPDFWriter class

### Phase 4: Optimization

- Benchmark compression performance
- Test with large PDFs (>10MB)
- Optimize WASM binary size
- Add Web Worker support for non-blocking compression

### Phase 5: Publishing

- Validate package with `npm run validate`
- Test in both browser and Node.js environments
- Publish to npm registry
- Create GitHub releases

## Build Artifacts

### Development Build

- WASM size: ~800KB (uncompressed)
- WASM size: ~300KB (gzip compressed)
- Total bundle size (ESM): ~50KB + WASM

### Production Considerations

- Use CDN with gzip/brotli compression
- Consider lazy-loading WASM module
- Provide Web Worker wrapper for UI responsiveness
- Cache WASM module in Service Worker

## Environment Variables

Currently none. All configuration is in config files.

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Build and Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Emscripten
        uses: mymindstorm/setup-emsdk@v12
        with:
          version: 'latest'

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build WASM
        run: npm run build:wasm

      - name: Build TypeScript
        run: npm run build:lib

      - name: Run tests
        run: npm test

      - name: Validate package
        run: npm run validate
```
