#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Building qpdf WASM from source...${NC}"

if ! command -v emcc &> /dev/null; then
    echo -e "${RED}Error: Emscripten not found!${NC}"
    echo "Please activate Emscripten environment first:"
    echo "  source /path/to/emsdk/emsdk_env.sh"
    exit 1
fi

QPDF_SOURCE="${QPDF_SOURCE:-../../../vendor/qpdf}"
if [ ! -d "$QPDF_SOURCE" ]; then
    echo -e "${RED}Error: qpdf source not found at $QPDF_SOURCE${NC}"
    echo "Please clone qpdf into vendor/qpdf"
    exit 1
fi
QPDF_SOURCE="$(cd "$QPDF_SOURCE" && pwd)"

echo -e "${GREEN}✓ Emscripten found: $(emcc --version | head -n1)${NC}"
echo -e "${GREEN}✓ qpdf source found at: $QPDF_SOURCE${NC}"

BUILD_DIR="cmake-build"
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

echo -e "${YELLOW}Running CMake configuration...${NC}"
emcmake cmake \
  -DQPDF_SOURCE_DIR="$QPDF_SOURCE" \
  -DCMAKE_TOOLCHAIN_FILE=../emscripten-toolchain.cmake \
  -DCMAKE_BUILD_TYPE=Release \
  ..

echo -e "${YELLOW}Compiling WASM (this may take a few minutes)...${NC}"
emmake make -j$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)

echo -e "${YELLOW}Installing artifacts...${NC}"
emmake make install

cd ..

OUTPUT_DIR="../build/wasm"
if [ -f "$OUTPUT_DIR/qpdf.wasm" ] && [ -f "$OUTPUT_DIR/qpdf.js" ]; then
    WASM_SIZE=$(du -h "$OUTPUT_DIR/qpdf.wasm" | cut -f1)
    echo -e "${GREEN}✓ Build successful!${NC}"
    echo -e "${GREEN}  qpdf.wasm: $WASM_SIZE${NC}"
    echo -e "${GREEN}  Output: $OUTPUT_DIR/${NC}"
else
    echo -e "${RED}Error: Build artifacts not found${NC}"
    exit 1
fi
