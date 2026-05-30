# syntax=docker/dockerfile:1.7
#
# JSI headers are fetched directly from the react-native npm tarball —
# no full npm install needed. Override the version with REACT_NATIVE_VERSION.

FROM ubuntu:24.04 AS jsi-builder

ARG JSI_BUILD_MODE=prd
ARG QPDF_VERSION
ARG QPDF_ARCHIVE_URL
ARG QPDF_SHA256=""
ARG QPDF_JOBS=""
ARG REACT_NATIVE_VERSION=0.76.0

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

# Fetch qpdf source
RUN set -eux; \
    mkdir -p /src/vendor/qpdf; \
    curl -fsSL "$QPDF_ARCHIVE_URL" -o /tmp/qpdf.tar.gz; \
    if [ -n "$QPDF_SHA256" ]; then \
        echo "$QPDF_SHA256  /tmp/qpdf.tar.gz" | sha256sum -c -; \
    fi; \
    tar -xzf /tmp/qpdf.tar.gz --strip-components=1 -C /src/vendor/qpdf

# Fetch JSI headers from the react-native npm tarball (no dep tree download)
RUN set -eux; \
    mkdir -p /tmp/rn-pkg; \
    curl -fsSL "https://registry.npmjs.org/react-native/-/react-native-${REACT_NATIVE_VERSION}.tgz" \
        -o /tmp/rn.tgz; \
    tar -xzf /tmp/rn.tgz --strip-components=1 -C /tmp/rn-pkg; \
    test -f /tmp/rn-pkg/ReactCommon/jsi/jsi/jsi.h

RUN set -eux; \
    case "$JSI_BUILD_MODE" in \
        dev) CMAKE_BUILD_TYPE=Debug ;; \
        prd) CMAKE_BUILD_TYPE=Release ;; \
        *) echo "Unsupported build mode: $JSI_BUILD_MODE" >&2; exit 1 ;; \
    esac; \
    BUILD_DIR=/tmp/jsi-build; \
    OUT_DIR=/out; \
    BUILD_JOBS="${QPDF_JOBS:-$(nproc)}"; \
    mkdir -p "$BUILD_DIR" "$OUT_DIR"; \
    cmake \
        -S /src/packages/core/native/targets/jsi/qpdf \
        -B "$BUILD_DIR" \
        -DCMAKE_BUILD_TYPE="$CMAKE_BUILD_TYPE" \
        -DQPDF_SOURCE_DIR=/src/vendor/qpdf \
        -DJSI_INCLUDE_DIR=/tmp/rn-pkg/ReactCommon; \
    cmake --build "$BUILD_DIR" --parallel "$BUILD_JOBS"; \
    cp "$BUILD_DIR/libpdfly_jsi.so" "$OUT_DIR/"; \
    cp /src/packages/core/native/targets/jsi/qpdf/qpdf_jsi.h "$OUT_DIR/"

FROM scratch AS export

COPY --from=jsi-builder /out/ /