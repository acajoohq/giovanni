# syntax=docker/dockerfile:1.7

FROM emscripten/emsdk:5.0.7 AS qpdf-builder

ARG QPDF_BUILD_MODE=prd
ARG QPDF_VERSION
ARG QPDF_ARCHIVE_URL
ARG QPDF_SHA256=""
ARG QPDF_JOBS=""

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        cmake \
        curl \
        make \
        tar \
        python3 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /src

COPY packages/core/native/qpdf /src/packages/core/native/qpdf
COPY packages/core/native/impl /src/packages/core/native/impl
COPY packages/core/native/interface /src/packages/core/native/interface

RUN set -eux; \
    mkdir -p /src/vendor/qpdf; \
    curl -fsSL "$QPDF_ARCHIVE_URL" -o /tmp/qpdf.tar.gz; \
    if [ -n "$QPDF_SHA256" ]; then \
        echo "$QPDF_SHA256  /tmp/qpdf.tar.gz" | sha256sum -c -; \
    fi; \
    tar -xzf /tmp/qpdf.tar.gz --strip-components=1 -C /src/vendor/qpdf

RUN set -eux; \
    case "$QPDF_BUILD_MODE" in \
        dev) \
            export CMAKE_BUILD_TYPE=Debug; \
            ;; \
        prd) \
            export CMAKE_BUILD_TYPE=Release; \
            ;; \
        *) \
            echo "Unsupported qpdf build mode: $QPDF_BUILD_MODE" >&2; \
            exit 1; \
            ;; \
    esac; \
    export SOURCE_DIR=/src/packages/core/native/qpdf; \
    export BUILD_DIR=/tmp/qpdf-build; \
    export OUT_DIR=/out; \
    export BUILD_JOBS="${QPDF_JOBS:-$(nproc)}"; \
    mkdir -p "$BUILD_DIR" "$OUT_DIR"; \
    cd "$BUILD_DIR"; \
    emcmake cmake \
        -DQPDF_SOURCE_DIR=/src/vendor/qpdf \
        -DCMAKE_TOOLCHAIN_FILE="$SOURCE_DIR/toolchains/emscripten.cmake" \
        -DCMAKE_BUILD_TYPE="$CMAKE_BUILD_TYPE" \
        "$SOURCE_DIR"; \
    cmake --build . --parallel "$BUILD_JOBS"; \
    test -f "$BUILD_DIR/qpdf.js"; \
    test -f "$BUILD_DIR/qpdf.wasm"; \
    cp "$BUILD_DIR/qpdf.js" "$OUT_DIR/qpdf.js"; \
    cp "$BUILD_DIR/qpdf.wasm" "$OUT_DIR/qpdf.wasm"; \
    if [ -f "$BUILD_DIR/CMakeCache.txt" ]; then cp "$BUILD_DIR/CMakeCache.txt" "$OUT_DIR/CMakeCache.txt"; fi; \
    cat > "$OUT_DIR/manifest.json" <<EOF
{
  "buildMode": "${QPDF_BUILD_MODE}",
  "sourceVersion": "${QPDF_VERSION}",
  "artifacts": [
    "qpdf.js",
    "qpdf.wasm"
  ]
}
EOF

FROM scratch AS export

COPY --from=qpdf-builder /out/ /
