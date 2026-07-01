# syntax=docker/dockerfile:1.7

FROM ubuntu:24.04 AS native-builder

ARG NATIVE_BUILD_MODE=prd
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
        g++ \
        make \
        pkg-config \
        tar \
        zlib1g-dev \
        libjpeg-dev \
        libssl-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /src

COPY packages/core/native /src/packages/core/native

RUN set -eux; \
    mkdir -p /src/vendor/qpdf; \
    curl -fsSL "$QPDF_ARCHIVE_URL" -o /tmp/qpdf.tar.gz; \
    if [ -n "$QPDF_SHA256" ]; then \
        echo "$QPDF_SHA256  /tmp/qpdf.tar.gz" | sha256sum -c -; \
    fi; \
    tar -xzf /tmp/qpdf.tar.gz --strip-components=1 -C /src/vendor/qpdf

RUN set -eux; \
    case "$NATIVE_BUILD_MODE" in \
        dev) CMAKE_BUILD_TYPE=Debug ;; \
        prd) CMAKE_BUILD_TYPE=Release ;; \
        *) echo "Unsupported build mode: $NATIVE_BUILD_MODE" >&2; exit 1 ;; \
    esac; \
    BUILD_DIR=/tmp/native-build; \
    OUT_DIR=/out; \
    BUILD_JOBS="${QPDF_JOBS:-$(nproc)}"; \
    mkdir -p "$BUILD_DIR" "$OUT_DIR"; \
    cmake \
        -S /src/packages/core/native/targets/native \
        -B "$BUILD_DIR" \
        -DCMAKE_BUILD_TYPE="$CMAKE_BUILD_TYPE" \
        -DQPDF_SOURCE_DIR=/src/vendor/qpdf; \
    cmake --build "$BUILD_DIR" --parallel "$BUILD_JOBS"; \
    ctest --output-on-failure --test-dir "$BUILD_DIR" -R giovanni_; \
    cp "$BUILD_DIR/libgiovanni_native.a" "$OUT_DIR/"; \
    find "$BUILD_DIR" -name "libqpdf.a" -exec cp {} "$OUT_DIR/" \; ; \
    cp /src/packages/core/native/targets/native/giovanni_c.h "$OUT_DIR/"

FROM scratch AS export

COPY --from=native-builder /out/ /
