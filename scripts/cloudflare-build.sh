#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EMSDK_VERSION="${EMSDK_VERSION:-5.0.6}"
EMSDK_DIR="${EMSDK_DIR:-$ROOT_DIR/.cloudflare-build/emsdk}"
QPDF_REF="${QPDF_REF:-v12.3.2}"
QPDF_SOURCE="${QPDF_SOURCE:-$ROOT_DIR/vendor/qpdf}"

cd "$ROOT_DIR"

if ! command -v emcc &> /dev/null; then
    echo "Installing Emscripten $EMSDK_VERSION..."

    if [ ! -d "$EMSDK_DIR/.git" ]; then
        rm -rf "$EMSDK_DIR"
        mkdir -p "$(dirname "$EMSDK_DIR")"
        git clone --depth 1 https://github.com/emscripten-core/emsdk.git "$EMSDK_DIR"
    fi

    "$EMSDK_DIR/emsdk" install "$EMSDK_VERSION"
    "$EMSDK_DIR/emsdk" activate "$EMSDK_VERSION"
    # shellcheck disable=SC1091
    source "$EMSDK_DIR/emsdk_env.sh"
fi

if [ ! -d "$QPDF_SOURCE/.git" ]; then
    echo "Cloning qpdf $QPDF_REF..."
    rm -rf "$QPDF_SOURCE"
    mkdir -p "$(dirname "$QPDF_SOURCE")"
    git clone --depth 1 --branch "$QPDF_REF" https://github.com/qpdf/qpdf.git "$QPDF_SOURCE"
fi

pnpm run build
